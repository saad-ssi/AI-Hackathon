import GameOver from "@/components/arcade/GameOver";

export const metadata = { title: "Game over | Agent-A-Thon 2026" };

export default function NotFound() {
  return (
    <div className="arcade">
      <main id="main">
        <section className="lvl">
          <div className="wrap">
            <GameOver />
          </div>
        </section>
      </main>
    </div>
  );
}
