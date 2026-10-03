"use client";

import { useRouter } from "next/navigation";

type Props = {
  /** Used when no titleNode is supplied. */
  title?: string;
  active: "home" | "recharge" | "plan" | "team" | "me";
  back?: boolean;
  titleNode?: React.ReactNode;
  rightNode?: React.ReactNode;
  /** Rendered between the fixed header and #appCapsule (e.g. the hero banner). */
  preContent?: React.ReactNode;
  /**
   * Classes on #appCapsule. The reference uses "p-0 pb-2" on pages that
   * already clear the header (e.g. the dashboard hero) and plain "pb-2"
   * elsewhere, where #appCapsule's own 60px top padding does the job.
   */
  capsuleClass?: string;
  /** Extra classes on .appContent, e.g. "pb-0 mt-3". */
  contentClass?: string;
  children: React.ReactNode;
  hideBottomNav?: boolean;
};

export default function AppShell({
  title,
  active,
  back = true,
  titleNode,
  rightNode,
  preContent,
  capsuleClass = "pb-2",
  contentClass = "",
  children,
  hideBottomNav = false,
}: Props) {
  const router = useRouter();

  return (
    <>
      <div className="appHeader">
        {back && (
          <div className="left">
            <a
              href="javascript:;"
              className="icon"
              onClick={(e) => {
                e.preventDefault();
                router.back();
              }}
            >
              <i className="icon ion-ios-arrow-back"></i>
            </a>
          </div>
        )}

        <div className="pageTitle">{titleNode ?? title}</div>

        {rightNode && <div className="right">{rightNode}</div>}
      </div>

      {preContent}

      <div id="appCapsule" className={capsuleClass}>
        <div className={`appContent ${contentClass}`}>{children}</div>
        <section className="panel-space"></section>
      </div>

      {hideBottomNav ? null : <BottomNav active={active} />}
    </>
  );
}

function BottomNav({ active }: { active: Props["active"] }) {
  const router = useRouter();

  const item = (key: Props["active"], label: string, path: string, icon: string) => (
    <div className={`item ${active === key ? "active" : ""}`}>
      <a
        href="javascript:;"
        onClick={(e) => {
          e.preventDefault();
          router.push(path);
        }}
      >
        <p>
          <i className={`icon ${icon}`}></i>
        </p>
        <span>{label}</span>
      </a>
    </div>
  );

  return (
    <div className="appBottomMenu">
      {item("home", "Home", "/dashboard", "ion-ios-home")}
      {item("recharge", "Recharge", "/recharge", "ion-ios-apps")}

      <div className="item">
        <a
          href="javascript:;"
          onClick={(e) => {
            e.preventDefault();
            router.push("/plan");
          }}
        >
          <p>
            <i className="icon">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/center-grid.svg"
                alt=""
                width={50}
                height={50}
                style={{ width: 50, height: 50, marginTop: -22 }}
              />
            </i>
          </p>
          <span></span>
        </a>
      </div>

      {item("team", "Team", "/team", "ion-ios-people")}
      {item("me", "Me", "/me", "ion-ios-person")}
    </div>
  );
}

function CenterGlyph() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#a855f7"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2.5" y="9" width="8" height="8" rx="2.2" />
      <rect x="13.5" y="2.5" width="8" height="8" rx="2.2" />
      <rect x="13.5" y="14" width="8" height="8" rx="2.2" />
      <rect x="2.5" y="20" width="8" height="2.5" rx="1.2" />
    </svg>
  );
}