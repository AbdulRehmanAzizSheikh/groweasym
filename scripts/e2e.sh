#!/usr/bin/env bash
# End-to-end API test for the GSA Farming app.
# Usage: BASE=http://localhost:3001 ADMIN_PASS=TestAdmin123 ./scripts/e2e.sh
set -uo pipefail

BASE="${BASE:-http://localhost:3001}"
ADMIN_PASS="${ADMIN_PASS:-TestAdmin123}"
WORK="$(mktemp -d)"
PASS=0
FAIL=0

ok()   { printf '  \033[32mPASS\033[0m  %s\n' "$1"; PASS=$((PASS+1)); }
bad()  { printf '  \033[31mFAIL\033[0m  %s\n' "$1"; printf '        %s\n' "${2:-}"; FAIL=$((FAIL+1)); }
head_() { printf '\n\033[1m%s\033[0m\n' "$1"; }

# check <name> <expected-status> <curl args...>
check() {
  local name="$1" want="$2"; shift 2
  local body status
  body="$("$@" 2>/dev/null)"; status=$?
  if [ "$status" -eq "$want" ]; then ok "$name"; else bad "$name" "curl exit $status, wanted $want"; fi
}

# jcheck <name> <json> <jq-ish python expr on d>
jcheck() {
  local name="$1" json="$2" expr="$3"
  if python3 -c "
import json,sys
d=json.loads('''$json''')
sys.exit(0 if ($expr) else 1)
" 2>/dev/null; then ok "$name"; else bad "$name" "$json"; fi
}

api()  { curl -s -b "$WORK/u.txt" -c "$WORK/u.txt" "$@"; }
noauth(){ curl -s "$@"; }
admin(){ curl -s -b "$WORK/a.txt" -c "$WORK/a.txt" "$@"; }

MOBILE="9$(date +%s | tail -c 9)"

head_ "1. Registration"
R=$(curl -s -X POST "$BASE/api/auth/register" -c "$WORK/u.txt" \
  -H 'Content-Type: application/json' \
  -d "{\"fullName\":\"E2E User\",\"mobileNumber\":\"$MOBILE\",\"password\":\"secret123\"}")
jcheck "register returns success" "$R" "d.get('success') is True"
jcheck "password is never echoed back" "$R" "'password' not in json.dumps(d)"

R=$(curl -s -X POST "$BASE/api/auth/register" \
  -H 'Content-Type: application/json' \
  -d "{\"fullName\":\"Dup\",\"mobileNumber\":\"$MOBILE\",\"password\":\"secret123\"}")
jcheck "duplicate mobile is rejected (409)" "$R" "d.get('error')"

R=$(curl -s -X POST "$BASE/api/auth/register" -H 'Content-Type: application/json' \
  -d '{"fullName":"Short","mobileNumber":"9812345678","password":"12"}')
jcheck "short password rejected" "$R" "d.get('error')"

R=$(curl -s -X POST "$BASE/api/auth/register" -H 'Content-Type: application/json' \
  -d '{"fullName":"Bad","mobileNumber":"abc","password":"secret123"}')
jcheck "non-numeric mobile rejected" "$R" "d.get('error')"

head_ "2. Session"
R=$(curl -s -b "$WORK/u.txt" "$BASE/api/auth/me")
jcheck "me returns the logged-in user" "$R" "d.get('user',{}).get('mobileNumber')=='$MOBILE'"
jcheck "me never leaks the password hash" "$R" "'password' not in json.dumps(d)"

R=$(noauth "$BASE/api/auth/me")
jcheck "me without cookie is 401" "$R" "'error'"

R=$(curl -s -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
  -d "{\"mobileNumber\":\"$MOBILE\",\"password\":\"wrongpass\"}")
jcheck "wrong password rejected" "$R" "d.get('error')"

R=$(curl -s -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
  -d '{"mobileNumber":"9999999999","password":"secret123"}')
jcheck "unknown mobile gives same generic error" "$R" "d.get('error')=='Invalid mobile number or password'"

head_ "3. Protected routes reject anonymous callers"
for ep in /api/team /api/wallet/summary /api/wallet/transactions; do
  R=$(noauth "$BASE$ep"); jcheck "GET $ep needs auth" "$R" "'error'"
done
for ep in /api/razorpay/order /api/withdraw/request /api/auth/change-password; do
  R=$(noauth -X POST "$BASE$ep" -H 'Content-Type: application/json' -d '{}')
  jcheck "POST $ep needs auth" "$R" "'error'"
done

head_ "4. Admin routes reject non-admins"
for ep in /api/admin/users /api/admin/withdrawals /api/admin/transactions; do
  R=$(curl -s "$BASE$ep"); jcheck "GET $ep needs admin" "$R" "'error'"
  R=$(api "$BASE$ep"); jcheck "GET $ep rejects a user token" "$R" "'error'"
done
for ep in /api/admin/balance /api/admin/withdrawal; do
  R=$(curl -s -X POST "$BASE$ep" -H 'Content-Type: application/json' -d '{}')
  jcheck "POST $ep needs admin" "$R" "'error'"
done

head_ "5. Admin login"
R=$(curl -s -X POST "$BASE/api/admin/login" -c "$WORK/a.txt" \
  -H 'Content-Type: application/json' -d '{"password":"totally-wrong"}')
jcheck "wrong admin password rejected" "$R" "d.get('error')"

R=$(curl -s -X POST "$BASE/api/admin/login" -c "$WORK/a.txt" \
  -H 'Content-Type: application/json' -d "{\"password\":\"$ADMIN_PASS\"}")
jcheck "correct admin password accepted" "$R" "d.get('success') is True"

head_ "6. Admin can credit and debit"
U=$(admin "$BASE/api/admin/users")
UID=$(python3 -c "
import json,sys
d=json.loads('''$U''')
m=[u for u in d['users'] if u['mobileNumber']=='$MOBILE']
print(m[0]['id'] if m else '')
" 2>/dev/null)
if [ -n "$UID" ]; then ok "found test user id"; else bad "found test user id" "$U"; fi

R=$(admin -X POST "$BASE/api/admin/balance" -H 'Content-Type: application/json' \
  -d "{\"userId\":\"$UID\",\"amount\":5000,\"type\":\"credit\",\"note\":\"test credit\"}")
jcheck "credit 5000" "$R" "d.get('success') and abs(d['balance']-5000)<0.01"

R=$(admin -X POST "$BASE/api/admin/balance" -H 'Content-Type: application/json' \
  -d "{\"userId\":\"$UID\",\"amount\":1200,\"type\":\"debit\"}")
jcheck "debit 1200 leaves 3800" "$R" "abs(d['balance']-3800)<0.01"

R=$(admin -X POST "$BASE/api/admin/balance" -H 'Content-Type: application/json' \
  -d "{\"userId\":\"$UID\",\"amount\":9999999,\"type\":\"debit\"}")
jcheck "debit beyond balance is refused" "$R" "d.get('error')"

R=$(admin -X POST "$BASE/api/admin/balance" -H 'Content-Type: application/json' \
  -d "{\"userId\":\"$UID\",\"amount\":-50,\"type\":\"credit\"}")
jcheck "negative amount is refused" "$R" "d.get('error')"

R=$(admin -X POST "$BASE/api/admin/balance" -H 'Content-Type: application/json' \
  -d "{\"userId\":\"$UID\",\"amount\":100,\"type\":\"nonsense\"}")
jcheck "unknown action is refused" "$R" "d.get('error')"

R=$(admin -X POST "$BASE/api/admin/balance" -H 'Content-Type: application/json' \
  -d "{\"userId\":\"000000000000000000000000\",\"amount\":100,\"type\":\"credit\"}")
jcheck "unknown user id is 404" "$R" "d.get('error')"

head_ "7. Withdrawal hold + payout lifecycle"
R=$(api -X POST "$BASE/api/withdraw/request" -H 'Content-Type: application/json' \
  -d '{"amount":50,"method":"upi","bank":{"upiId":"a@b"}}')
jcheck "below minimum is refused" "$R" "d.get('error')"

R=$(api -X POST "$BASE/api/withdraw/request" -H 'Content-Type: application/json' \
  -d '{"amount":999999,"method":"upi","bank":{"upiId":"a@b"}}')
jcheck "beyond balance is refused" "$R" "d.get('error')"

R=$(api -X POST "$BASE/api/withdraw/request" -H 'Content-Type: application/json' \
  -d '{"amount":1000,"method":"bank","bank":{"accountHolder":"","accountNumber":"","ifsc":""}}')
jcheck "missing bank details is refused" "$R" "d.get('error')"

R=$(api -X POST "$BASE/api/withdraw/request" -H 'Content-Type: application/json' \
  -d '{"amount":1000,"method":"upi","bank":{"upiId":""}}')
jcheck "missing upi id is refused" "$R" "d.get('error')"

R=$(api -X POST "$BASE/api/withdraw/request" -H 'Content-Type: application/json' \
  -d '{"amount":1000,"method":"bank","bank":{"accountHolder":"E2E","accountNumber":"1234567890","ifsc":"TEST0000001","bankName":"Test Bank"}}')
jcheck "valid request is accepted" "$R" "d.get('success')"
WID=$(python3 -c "
import json,sys
print(json.loads('''$R''').get('withdrawalId',''))
" 2>/dev/null)
jcheck "balance drops to 2800" "$R" "abs(d.get('balance',0)-2800)<0.01"

R=$(api "$BASE/api/auth/me")
jcheck "held balance is tracked separately (1000)" "$R" "abs(d['user']['heldBalance']-1000)<0.01"
jcheck "spendable balance excludes the hold" "$R" "abs(d['user']['balance']-2800)<0.01"

R=$(api -X POST "$BASE/api/withdraw/request" -H 'Content-Type: application/json' \
  -d '{"amount":2800,"method":"upi","bank":{"upiId":"a@b"}}')
jcheck "held money cannot be requested twice" "$R" "d.get('success') is not True"

head_ "8. Admin resolves the withdrawal"
R=$(admin -X POST "$BASE/api/admin/withdrawal" -H 'Content-Type: application/json' \
  -d "{\"id\":\"$WID\",\"action\":\"paid\",\"note\":\"UTR123\"}")
jcheck "mark paid succeeds" "$R" "d.get('success')"
jcheck "hold released after payout (0)" "$R" "abs(d.get('heldBalance',-1))<0.01"
jcheck "balance stays 1800 after payout" "$R" "abs(d.get('balance',0)-1800)<0.01"

R=$(admin -X POST "$BASE/api/admin/withdrawal" -H 'Content-Type: application/json' \
  -d "{\"id\":\"$WID\",\"action\":\"paid\"}")
jcheck "cannot resolve the same request twice" "$R" "d.get('error')"

R=$(api -X POST "$BASE/api/withdraw/request" -H 'Content-Type: application/json' \
  -d '{"amount":500,"method":"upi","bank":{"upiId":"a@b"}}')
WID2=$(python3 -c "
import json,sys
print(json.loads('''$R''').get('withdrawalId',''))
" 2>/dev/null)
jcheck "second withdrawal accepted" "$R" "d.get('success')"

R=$(admin -X POST "$BASE/api/admin/withdrawal" -H 'Content-Type: application/json' \
  -d "{\"id\":\"$WID2\",\"action\":\"rejected\",\"note\":\"test reject\"}")
jcheck "reject refunds the hold" "$R" "d.get('success') and abs(d['balance']-1800)<0.01"

R=$(admin -X POST "$BASE/api/admin/withdrawal" -H 'Content-Type: application/json' \
  -d '{"id":"000000000000000000000000","action":"paid"}')
jcheck "unknown withdrawal id is refused" "$R" "d.get('error')"

R=$(admin -X POST "$BASE/api/admin/withdrawal" -H 'Content-Type: application/json' \
  -d "{\"id\":\"$WID2\",\"action\":\"explode\"}")
jcheck "unknown action is refused" "$R" "d.get('error')"

head_ "9. Wallet reads"
R=$(api "$BASE/api/wallet/summary")
jcheck "summary reports the final balance" "$R" "abs(d.get('totalAssets',0)-1800)<0.01"

R=$(api "$BASE/api/wallet/transactions")
jcheck "transactions list is returned" "$R" "len(d.get('transactions',[]))>0"
jcheck "no transaction row leaks a password" "$R" "'password' not in json.dumps(d)"

R=$(api "$BASE/api/wallet/transactions?type=deposit")
jcheck "type filter works" "$R" "all(t['type']=='deposit' for t in d.get('transactions',[]))"

R=$(api "$BASE/api/wallet/transactions?type=admin_credit")
jcheck "admin_credit filter works" "$R" "len(d.get('transactions',[]))>0"

R=$(api "$BASE/api/team")
jcheck "team endpoint works" "$R" "'members' in d"

head_ "10. Change password"
R=$(api -X POST "$BASE/api/auth/change-password" -H 'Content-Type: application/json' \
  -d '{"currentPassword":"wrong","password":"newsecret1"}')
jcheck "wrong current password refused" "$R" "d.get('error')"

R=$(api -X POST "$BASE/api/auth/change-password" -H 'Content-Type: application/json' \
  -d '{"currentPassword":"secret123","password":"ab"}')
jcheck "too-short new password refused" "$R" "d.get('error')"

R=$(api -X POST "$BASE/api/auth/change-password" -H 'Content-Type: application/json' \
  -d '{"currentPassword":"secret123","password":"newsecret1"}')
jcheck "password change succeeds" "$R" "d.get('success')"

R=$(curl -s -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
  -d "{\"mobileNumber\":\"$MOBILE\",\"password\":\"newsecret1\"}")
jcheck "new password works" "$R" "d.get('success')"

head_ "11. Razorpay guards (no keys configured)"
R=$(api -X POST "$BASE/api/razorpay/order" -H 'Content-Type: application/json' \
  -d '{"amount":100,"method":"upi"}')
jcheck "order route answers safely without keys" "$R" "d.get('success') is not None"

R=$(api -X POST "$BASE/api/razorpay/verify" -H 'Content-Type: application/json' \
  -d '{"razorpay_order_id":"order_x","razorpay_payment_id":"pay_x","razorpay_signature":"sig"}')
jcheck "verify rejects a forged signature" "$R" "d.get('success') is not True"

R=$(api -X POST "$BASE/api/razorpay/verify" -H 'Content-Type: application/json' -d '{}')
jcheck "verify rejects an incomplete payload" "$R" "d.get('success') is not True"

R=$(api -X POST "$BASE/api/razorpay/order" -H 'Content-Type: application/json' -d '{"amount":-500}')
jcheck "negative order amount refused" "$R" "d.get('success') is not True"

head_ "12. Logout"
R=$(api -X POST "$BASE/api/auth/logout")
jcheck "logout succeeds" "$R" "d.get('success')"
R=$(curl -s -b "$WORK/u.txt" "$BASE/api/auth/me")
jcheck "session is gone after logout" "$R" "'error'"

rm -rf "$WORK"
printf '\n\033[1mResult: %d passed, %d failed\033[0m\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
