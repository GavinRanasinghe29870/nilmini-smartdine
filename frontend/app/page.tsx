"use client";

import Link from "next/link";

export default function WelcomeSection() {
  const videoUrl =
    "https://res.cloudinary.com/dueeocjg9/video/upload/v1777412458/0429_1_wx63sj.mp4";

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-black">
      {/* Background Video */}
      <video
        className="absolute inset-0 z-0 w-full h-full object-cover"
        src={videoUrl}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        controls={false}
        onLoadedData={() => console.log("Hero video loaded successfully")}
        onError={(e) => console.error("Hero video failed to load", e)}
      />

      {/* Blur Layer */}
      <div className="absolute inset-0 z-10 bg-black/20 backdrop-blur-[2px]" />

      {/* Left Dark Gradient for Text Visibility */}
      {/* <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/80 via-black/45 to-transparent" /> */}

      {/* Content */}
      <div className="relative z-20 max-w-3xl px-12">
        <h1 className="text-big-heading font-semibold mb-4 text-white">
          Welcome to
        </h1>

        <h2 className="text-big-heading font-bold text-primary mb-8">
          NILMINI HOTEL
        </h2>

        <p className="text-paragraph text-gray-200 leading-relaxed mb-10">
          At Nilmini Hotel, we serve fresh, flavorful food with care — and now
          we&apos;re exploring smart technology to make your experience even
          better. Our new AI-powered system predicts daily menu demand, suggests
          creative meal ideas, and helps us plan stocks more efficiently.
          <br />
          <br />
          Enjoy better service, smarter menus, and delicious meals — all crafted
          for you.
        </p>

        <Link
          href="/productPlacing"
          className="inline-block bg-button text-white px-16 py-5 rounded-xl text-h4 font-semibold hover:opacity-90 transition"
        >
          Continue
        </Link>
      </div>
    </section>
  );
}