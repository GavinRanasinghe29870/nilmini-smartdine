export default function WelcomeSection() {
  return (
    <section
      className="min-h-screen flex items-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/backgroundImage.jpg')" }}
    >
      <div className="max-w-3xl px-12">
        <h1 className="text-big-heading font-semibold mb-4">
          Welcome to
        </h1>

        <h2 className="text-big-heading font-bold text-primary mb-8">
          NILMINI HOTEL
        </h2>

        <p className="text-paragraph text-gray-300 leading-relaxed mb-10">
          At Nilmini Hotel, we serve fresh, flavorful food with care — and now
          we&apos;re exploring smart technology to make your experience even better.
          Our new AI-powered system predicts daily menu demand, suggests creative
          meal ideas, and helps us plan stocks more efficiently.
          <br /><br />
          Enjoy better service, smarter menus, and delicious meals — all crafted
          for you.
        </p>

        <button className="bg-button text-white px-16 py-5 rounded-xl text-h4 font-semibold hover:opacity-90 transition">
          Continue
        </button>
      </div>
    </section>
  );
}
