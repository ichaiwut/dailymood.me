export function NotFoundCharacter() {
  return (
    <div style={{ position: "relative", width: 200, height: 200, margin: "0 auto" }}>
      {/* floating ? badge top-left */}
      <div
        className="pop"
        style={{
          position: "absolute",
          top: -4,
          left: -16,
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "var(--peach)",
          color: "#fff",
          display: "grid",
          placeItems: "center",
          fontSize: 18,
          fontWeight: 800,
          zIndex: 2,
          animationDelay: "200ms",
        }}
      >
        ?
      </div>

      {/* main blue circle */}
      <div
        style={{
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "var(--blue)",
          display: "grid",
          placeItems: "center",
          position: "relative",
        }}
      >
        {/* kawaii face */}
        <svg width="80" height="50" viewBox="0 0 80 50" fill="none">
          {/* left eye */}
          <circle cx="24" cy="20" r="6" fill="#1a1a1a" />
          <circle cx="26" cy="17" r="2.2" fill="#fff" />
          {/* right eye */}
          <circle cx="56" cy="20" r="6" fill="#1a1a1a" />
          <circle cx="58" cy="17" r="2.2" fill="#fff" />
          {/* smile */}
          <path d="M30 34 Q40 44 50 34" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </svg>
      </div>

      {/* floating ? badge bottom-right */}
      <div
        className="pop"
        style={{
          position: "absolute",
          bottom: 16,
          right: -12,
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "var(--peach)",
          color: "#fff",
          display: "grid",
          placeItems: "center",
          fontSize: 16,
          fontWeight: 800,
          zIndex: 2,
          animationDelay: "400ms",
        }}
      >
        ?
      </div>
    </div>
  );
}

export function ForbiddenCharacter() {
  return (
    <div style={{ position: "relative", width: 200, height: 200, margin: "0 auto" }}>
      {/* sparkle top-left */}
      <svg
        className="pop"
        style={{ position: "absolute", top: -2, left: -10, animationDelay: "200ms" }}
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
      >
        <path d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8Z" fill="var(--purple)" opacity="0.5" />
      </svg>

      {/* sparkle top-right */}
      <svg
        className="pop"
        style={{ position: "absolute", top: 8, right: -14, animationDelay: "500ms" }}
        width="14"
        height="14"
        viewBox="0 0 20 20"
        fill="none"
      >
        <path d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8Z" fill="var(--purple)" opacity="0.4" />
      </svg>

      {/* main orange circle */}
      <div
        style={{
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "var(--peach)",
          display: "grid",
          placeItems: "center",
          position: "relative",
        }}
      >
        {/* kawaii face — closed eyes + blush */}
        <svg width="100" height="60" viewBox="0 0 100 60" fill="none">
          {/* left closed eye */}
          <path d="M24 24 Q32 16 40 24" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" fill="none" />
          {/* right closed eye */}
          <path d="M60 24 Q68 16 76 24" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" fill="none" />
          {/* left blush */}
          <ellipse cx="22" cy="36" rx="9" ry="5" fill="#f4845f" opacity="0.35" />
          {/* right blush */}
          <ellipse cx="78" cy="36" rx="9" ry="5" fill="#f4845f" opacity="0.35" />
          {/* small mouth */}
          <path d="M44 42 Q50 48 56 42" stroke="#1a1a1a" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        </svg>
      </div>

      {/* lock badge */}
      <div
        className="pop"
        style={{
          position: "absolute",
          bottom: -4,
          left: "50%",
          transform: "translateX(-50%)",
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "var(--purple)",
          display: "grid",
          placeItems: "center",
          zIndex: 2,
          animationDelay: "300ms",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="5" y="11" width="14" height="10" rx="2" fill="#fff" />
          <path d="M8 11V7a4 4 0 118 0v4" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
