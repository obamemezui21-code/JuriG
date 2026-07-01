import { defaultAppLogo } from "../assets/branding";

const AppPreloader = ({ compact = false }) => {
  return (
    <div className={`app-preloader ${compact ? "app-preloader-compact" : ""}`} role="status" aria-live="polite" aria-label="Chargement">
      <div className="app-preloader-logo-wrap">
        <img className="app-preloader-logo" src={defaultAppLogo} alt="JuriGabon" />
      </div>
      <div className="app-preloader-ring" aria-hidden="true" />
    </div>
  );
};

export default AppPreloader;
