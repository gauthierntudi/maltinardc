import { Brand } from "@/components/Brand";
import { ParticipationForm } from "@/components/ParticipationForm";

export default function HomePage() {
  return (
    <>
      <img className="bg" src="/images/bg.png" alt="" />
      <header className="hero">
        <div className="col">
          <Brand />
          <h1 className="headline">
            <span className="line line-white">Participe et tente</span>
            <span className="line line-gold">
              <span className="gold-word">
                <span className="rays" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
                de gagner
              </span>
            </span>
            <span className="line line-white line-last">plusieurs cadeaux&nbsp;!</span>
          </h1>
          <ParticipationForm />
        </div>
      </header>
      <footer className="band">
        <p className="tagline">Nourrissante et pleine de vie&nbsp;!</p>
      </footer>
    </>
  );
}
