"use client";

import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { useSession } from "@/components/useSession";
import { ASSETS, LINKS } from "@/lib/assets";

const PRODUCTS = [
  {
    title: "Cocoa Power",
    body: "Offering farm fresh, nutritious and chemical free 100% cocoa power to fit your healthy lifestyle.",
    image: ASSETS.productCocoa,
  },
  {
    title: "COMPOUND COATINGS",
    body: "COMPOUND COATINGS Made With Natural Cocoa",
    image: ASSETS.productCoating,
  },
  {
    title: "CHOCOLATE",
    body: "In an organic agricultural production system, Natural Process CHOCOLATE",
    image: ASSETS.productChocolate,
  },
  {
    title: "Palm Oil",
    body: "Natural Process Pure Palm Oil",
    image: ASSETS.productPalm,
  },
];

export default function Dashboard() {
  const router = useRouter();
  // Redirects to /login when there is no session.
  useSession();

  return (
    <AppShell
      active="home"
      back={false}
      titleNode={
        <img
          src={ASSETS.logo}
          alt="GSA Farming"
          width={100}
          style={{ height: "auto", maxHeight: 34 }}
        />
      }
      capsuleClass="p-0 pb-2"
      preContent={
        <img
          src={ASSETS.bannerMain}
          alt=""
          className="img-fluid bg-img bannerHero"
        />
      }
    >
      <div className="aui-palace mt-1 mb-1">
        <a
          href="javascript:;"
          className="aui-palace-grid"
          onClick={(e) => {
            e.preventDefault();
            router.push("/recharge");
          }}
        >
          <div className="aui-palace-grid-icon">
            <img src={ASSETS.iconRecharge} alt="" />
          </div>
          <div className="aui-palace-grid-text">
            <h2>Recharge</h2>
          </div>
        </a>

        <a
          href={LINKS.appStore}
          target="_blank"
          rel="noreferrer"
          className="aui-palace-grid"
        >
          <div className="aui-palace-grid-icon">
            <img src={ASSETS.iconApp} alt="" />
          </div>
          <div className="aui-palace-grid-text">
            <h2>APP</h2>
          </div>
        </a>

        <a
          href="javascript:;"
          className="aui-palace-grid"
          onClick={(e) => {
            e.preventDefault();
            router.push("/withdraw");
          }}
        >
          <div className="aui-palace-grid-icon">
            <img src={ASSETS.iconWithdraw} alt="" />
          </div>
          <div className="aui-palace-grid-text">
            <h2>Withdraw</h2>
          </div>
        </a>

        <a
          href="javascript:;"
          className="aui-palace-grid"
          onClick={(e) => {
            e.preventDefault();
            router.push("/plan");
          }}
        >
          <div className="aui-palace-grid-icon">
            <img src={ASSETS.iconPlans} alt="" />
          </div>
          <div className="aui-palace-grid-text">
            <h2>plans</h2>
          </div>
        </a>
      </div>

      {/* Other options */}
      <div className="sectionTitle mt-2 mb-1">
        <div className="title">
          <h1>Other Options</h1>
        </div>

        <div className="aui-palace mt-1 mb-1">
          <a
            href="javascript:;"
            className="aui-palace-grid yue"
            onClick={(e) => {
              e.preventDefault();
              router.push("/change-password");
            }}
          >
            <div className="aui-palace-grid-icon">
              <img src={ASSETS.iconPassword} alt="" style={{ width: "80%" }} />
            </div>
            <div className="aui-palace-grid-text">
              <h2>Passwords</h2>
            </div>
          </a>

          <a
            href={LINKS.telegram}
            target="_blank"
            rel="noreferrer"
            className="aui-palace-grid yue"
          >
            <div className="aui-palace-grid-icon">
              <img src={ASSETS.iconTelegram} alt="" style={{ width: "80%" }} />
            </div>
            <div className="aui-palace-grid-text">
              <h2>Telegram</h2>
            </div>
          </a>

          <a
            href={LINKS.whatsapp}
            target="_blank"
            rel="noreferrer"
            className="aui-palace-grid yue"
          >
            <div className="aui-palace-grid-icon">
              <img src={ASSETS.iconWhatsapp} alt="" style={{ width: "80%" }} />
            </div>
            <div className="aui-palace-grid-text">
              <h2>Whatsaap</h2>
            </div>
          </a>
        </div>
      </div>

      {/* About */}
      <div className="sectionTitle mt-2 mb-1 rune">
        <div className="title">
          <h1>GSA Farming main business</h1>
        </div>
        <div className="contentBox">
          <div className="contentBox-body">
            For agricultural manufacturing business. In addition to organic
            vegetables, organic grains and grains, the company grows a variety of
            organic fruits and vegetables. The company&apos;s integrated business
            is the cultivation, processing and distribution of agricultural
            products. In addition to these businesses, the company also produces,
            sells and manufactures organic fertilizers and dairy products.
          </div>
        </div>
      </div>

      <div className="bannerWrap">
        <img src={ASSETS.bannerSide} alt="" />
      </div>

      <div className="sectionTitle mt-2 mb-1 rune">
        <div className="title">
          <h1>our products</h1>
        </div>
        <div className="contentBox">
          <div className="contentBox-body">
            We are an agricultural company. Farmers around the world use our
            innovative products to increase yields while conserving more
            resources. We help farmers increase yields sustainably.
          </div>
        </div>
      </div>

      <div className="sectionTitle mt-2 mb-1">
        <div className="itemList">
          {PRODUCTS.map((p) => (
            <div className="item" key={p.title}>
              <div className="image">
                <img src={p.image} alt={p.title} />
              </div>
              <div className="text">
                <h4 className="title">{p.title}</h4>
                <span>{p.body}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}