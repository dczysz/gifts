import { Link } from "@remix-run/react";
import { CloseIcon } from "~/icons/close";

interface Props {
  className?: string;
  location?: string;
  onClick?: () => void;
}

export function BackButton({ location, onClick, className }: Props) {
  return (
    <div className={`back-button ${className || ""}`}>
      {onClick ? (
        <button onClick={onClick}>
          <CloseIcon />
        </button>
      ) : (
        <Link to={location || ".."}>
          <CloseIcon />
        </Link>
      )}
    </div>
  );
}
