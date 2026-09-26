const facebookUrl = "https://www.facebook.com/maltinardc";
const instagramUrl = "https://www.instagram.com/maltinardc";

function StepBadge({ n }: { n: number }) {
  return <span className="mechanic-num">{n}</span>;
}

export function ContestMechanic() {
  return (
    <div className="mechanic" aria-label="Mécanique du jeu">
      <ol className="mechanic-steps">
        <li className="mechanic-step">
          <div className="mechanic-step-visual">
            <StepBadge n={1} />
            <div className="mechanic-icons" aria-hidden="true">
              <span className="social-chip fb">
                <i className="bi bi-facebook" />
              </span>
              <span className="social-chip ig">
                <i className="bi bi-instagram" />
              </span>
            </div>
          </div>
          <div className="mechanic-step-copy">
            <p className="mechanic-lead">Abonne-toi</p>
            <p className="mechanic-text">à nos pages Facebook et Instagram.</p>
          </div>
        </li>

        <li className="mechanic-step">
          <div className="mechanic-step-visual">
            <StepBadge n={2} />
            <i className="bi bi-camera mechanic-bi" aria-hidden="true" />
          </div>
          <div className="mechanic-step-copy">
            <p className="mechanic-lead">Prends une photo</p>
            <p className="mechanic-text">avec ta MALTINA.</p>
          </div>
        </li>

        <li className="mechanic-step">
          <div className="mechanic-step-visual">
            <StepBadge n={3} />
            <i className="bi bi-share mechanic-bi" aria-hidden="true" />
          </div>
          <div className="mechanic-step-copy">
            <p className="mechanic-lead">Tague la page</p>
            <p className="mechanic-handle">@maltinardc</p>
            <p className="mechanic-text">
              sur Facebook ou Instagram avec le hashtag <strong>#maltinardc</strong> et tente de gagner{" "}
              <strong>plusieurs cadeaux !</strong>
            </p>
          </div>
        </li>
      </ol>

      <div className="mechanic-actions">
        <a className="mechanic-pill" href={facebookUrl} target="_blank" rel="noopener noreferrer">
          <i className="bi bi-facebook" aria-hidden="true" />
          Facebook
        </a>
        <a className="mechanic-pill" href={instagramUrl} target="_blank" rel="noopener noreferrer">
          <i className="bi bi-instagram" aria-hidden="true" />
          Instagram
        </a>
      </div>
    </div>
  );
}
