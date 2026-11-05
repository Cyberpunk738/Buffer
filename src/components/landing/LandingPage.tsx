import { useState } from "react";
import {
  ArrowRight,
  Upload,
  Sliders,
  Crop,
  Download,
  Layers,
  Check,
  ChevronDown,
  X,
  Menu,
  ShieldCheck,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";
import { Brand } from "../shared/Brand";
import { StudioIllustration } from "../shared/StudioIllustration";
import { SAMPLE_SVG } from "../../lib/image-file";

const questions = [
  [
    "Do my photos leave my device?",
    "No. Buffer reads and edits your images in your browser. Image contents are not uploaded to a server. Your current session clears when you refresh or close the page.",
  ],
  [
    "What can I edit?",
    "Crop, resize, rotate, flip, adjust light and colour, and stack filters. Upload a PNG, JPEG, or WebP image up to 25 MB and 36 million pixels.",
  ],
  [
    "Can I undo my edits?",
    "Yes. Use the undo and redo buttons or Ctrl/Cmd + Z and Ctrl/Cmd + Shift + Z. Your original image is kept intact during your editing session.",
  ],
  [
    "Which formats can I export?",
    "Download PNG for lossless output and transparency, or choose JPEG or WebP with adjustable quality. JPEG exports use a white background for transparent areas.",
  ],
];
const sample =
  "data:image/svg+xml;charset=utf-8," + encodeURIComponent(SAMPLE_SVG);
export function LandingPage({
  onStart,
  onDemo,
}: {
  onStart: () => void;
  onDemo: () => void;
}) {
  const [menu, setMenu] = useState(false),
    [faq, setFaq] = useState<number | null>(0);
  return (
    <div className="landing">
      <header className="site-header page-width">
        <a href="#" aria-label="Buffer home">
          <Brand />
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#privacy">Privacy</a>
          <a href="#questions">FAQs</a>
        </nav>
        <div className="header-actions">
          <button className="button button-quiet demo-link" onClick={onDemo}>
            Try a sample
          </button>
          <button className="button button-mint" onClick={onStart}>
            Open editor <ArrowRight size={15} />
          </button>
          <button
            className="icon-button menu-toggle"
            aria-label={menu ? "Close menu" : "Open menu"}
            aria-expanded={menu}
            aria-controls="mobile-navigation"
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>
      {menu && (
        <nav className="mobile-navigation" id="mobile-navigation">
          {[
            ["Features", "features"],
            ["How it works", "how-it-works"],
            ["Privacy", "privacy"],
            ["FAQs", "questions"],
          ].map(([name, id]) => (
            <a key={id} href={"#" + id} onClick={() => setMenu(false)}>
              {name}
              <ArrowRight size={15} />
            </a>
          ))}
        </nav>
      )}
      <main>
        <section className="hero page-width">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="status-dot" /> A LITTLE SPACE TO CREATE
            </span>
            <h1>
              Good images.
              <br />
              Great possibilities.
              <br />
              <span>Made by you.</span>
            </h1>
            <p>
              A thoughtful image editor for your everyday ideas. Crop,
              fine-tune, and find your look — right here in your browser.
            </p>
            <div className="hero-actions">
              <button onClick={onStart} className="button button-mint">
                <Upload size={16} />
                Start editing
              </button>
              <button onClick={onDemo} className="button button-quiet">
                Explore a sample <ArrowRight size={16} />
              </button>
            </div>
            <div className="hero-facts">
              <div>
                <strong>100%</strong>
                <span>Local image processing</span>
              </div>
              <div>
                <strong>3 formats</strong>
                <span>PNG, JPEG & WebP exports</span>
              </div>
            </div>
            <p className="no-account">
              <Check size={14} />
              No account. No upload to a server. Just create.
            </p>
          </div>
          <div className="hero-illustration">
            <StudioIllustration />
            <span className="illustration-note">
              <Sparkles size={13} />A fresh perspective, one edit at a time.
            </span>
          </div>
        </section>
        <section className="tool-strip page-width" aria-label="Editing tools">
          <span>
            THE EVERYDAY
            <br />
            <strong>CREATIVE TOOLKIT</strong>
          </span>
          {[
            [Crop, "Crop & resize"],
            [Sliders, "Light & colour"],
            [Layers, "Stack effects"],
            [Download, "Make it yours"],
          ].map(([Icon, label]) => {
            const I = Icon as typeof Crop;
            return (
              <div key={label as string}>
                <I size={23} />
                {label as string}
              </div>
            );
          })}
        </section>
        <section className="possibilities" aria-label="Creative possibilities">
          <div className="sample-grid">
            {[
              "Original",
              "Fresh perspective",
              "Monochrome",
              "Warm light",
              "A closer look",
              "Colour study",
            ].map((name, i) => (
              <div className={"sample-tile sample-" + i} key={name}>
                <img
                  src={sample}
                  alt="Illustrated still life with a green vase and orange"
                  loading="lazy"
                />
                <span>{name}</span>
              </div>
            ))}
          </div>
          <div className="possibilities-overlay">
            <span className="eyebrow">
              SMALL ADJUSTMENTS. NEW POSSIBILITIES.
            </span>
            <h2>
              Make room for
              <br />
              your next idea.
            </h2>
            <p>A lighter workspace for a little more creativity.</p>
            <button onClick={onDemo} className="button button-mint">
              Try it for yourself <ArrowRight size={15} />
            </button>
          </div>
        </section>
        <section id="features" className="features page-width">
          <div className="section-header">
            <div>
              <span className="eyebrow">LESS FRICTION. MORE FLOW.</span>
              <h2>
                Your everyday edits.
                <br />
                Thoughtfully simplified.
              </h2>
              <p>
                From a quick crop to a whole new mood. The tools you need,
                <br className="desktop-break" /> with a little space to explore.
              </p>
            </div>
            <button className="button button-quiet" onClick={onStart}>
              Explore the tools <ArrowRight size={15} />
            </button>
          </div>
          <div className="feature-grid">
            <article className="feature-card feature-main">
              <div>
                <span className="feature-tag">01 / MAKE IT FIT</span>
                <h3>A new frame of mind.</h3>
                <p>
                  Crop distractions. Find your angle. Resize for wherever your
                  image goes next.
                </p>
              </div>
              <div className="crop-illustration">
                <div className="crop-image">
                  <img
                    src={sample}
                    alt="Still life inside a crop frame"
                    loading="lazy"
                  />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
                <span>YOUR VISION, PERFECTLY FRAMED.</span>
              </div>
            </article>
            <article className="feature-card">
              <div>
                <span className="feature-tag">02 / KEEP IT YOURS</span>
                <h3>Your images. Your business.</h3>
                <p>
                  All image processing happens in your browser. Your originals
                  stay on your device.
                </p>
              </div>
              <div className="privacy-illustration">
                <span />
                <span />
                <span />
                <span />
                <div>
                  <ShieldCheck size={48} strokeWidth={1.5} />
                </div>
              </div>
            </article>
            <article className="feature-card">
              <div>
                <span className="feature-tag">03 / FIND YOUR LOOK</span>
                <h3>A little light. A lot of character.</h3>
                <p>
                  Adjust brightness, contrast, and colour. Stack effects and
                  compare with your original.
                </p>
              </div>
              <div className="slider-illustration">
                {[
                  ["Brightness", "+24", "65%"],
                  ["Contrast", "+12", "54%"],
                  ["Saturation", "−8", "42%"],
                ].map(([label, value, left]) => (
                  <div key={label}>
                    <span>
                      {label}
                      <b>{value}</b>
                    </span>
                    <i>
                      <em style={{ left }} />
                    </i>
                  </div>
                ))}
              </div>
            </article>
            <article className="feature-card">
              <div>
                <span className="feature-tag">04 / OUT INTO THE WORLD</span>
                <h3>Ready for your next chapter.</h3>
                <p>
                  Export at your edited resolution. Choose PNG, JPEG, or WebP
                  and the quality you need.
                </p>
              </div>
              <div className="export-illustration">
                <div>
                  <ImageIcon size={30} strokeWidth={1.3} />
                  <span>your-next-idea</span>
                  <Check size={15} />
                </div>
                <section>
                  <span>.PNG</span>
                  <span>.JPG</span>
                  <span>.WEBP</span>
                </section>
              </div>
            </article>
          </div>
        </section>
        <section id="how-it-works" className="workflow page-width">
          <div>
            <span className="eyebrow">AN EASY CREATIVE ROUTINE</span>
            <h2>
              From “almost”
              <br />
              to “that’s the one.”
            </h2>
            <button className="button button-dark" onClick={onStart}>
              Let’s make something <ArrowRight size={15} />
            </button>
          </div>
          <ol>
            {[
              [
                "Bring your image",
                "Drop in a PNG, JPEG, or WebP. A blank canvas for your next idea.",
              ],
              [
                "Make a few moves",
                "Find your crop, adjust your colours, and try a new effect. Undo is always close by.",
              ],
              [
                "Take it with you",
                "Pick your format, download your edit, and put it out into the world.",
              ],
            ].map(([title, body], i) => (
              <li key={title}>
                <span>0{i + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
        <section id="privacy" className="privacy-section">
          <div className="page-width privacy-content">
            <span className="privacy-mark">
              <ShieldCheck size={52} strokeWidth={1.25} />
            </span>
            <div>
              <span className="eyebrow">
                A WORKSPACE THAT RESPECTS YOUR SPACE
              </span>
              <h2>
                Creativity without
                <br />
                the cloud upload.
              </h2>
              <p>
                No sign-up to get started. No server processing of your images.
                <br />
                Just you, your browser, and your next good idea.
              </p>
            </div>
            <button className="button button-dark" onClick={onStart}>
              Open your workspace <ArrowRight size={15} />
            </button>
          </div>
        </section>
        <section id="questions" className="faq page-width">
          <div>
            <span className="eyebrow">A LITTLE MORE CLARITY</span>
            <h2>
              Good questions.
              <br />
              Simple answers.
            </h2>
          </div>
          <div>
            {questions.map(([q, a], i) => (
              <article key={q}>
                <h3>
                  <button
                    onClick={() => setFaq(faq === i ? null : i)}
                    aria-expanded={faq === i}
                    aria-controls={"faq-" + i}
                  >
                    {q}
                    <ChevronDown
                      size={17}
                      className={faq === i ? "rotated" : ""}
                    />
                  </button>
                </h3>
                <p id={"faq-" + i} hidden={faq !== i}>
                  {a}
                </p>
              </article>
            ))}
          </div>
        </section>
        <section className="closing-cta page-width">
          <StudioIllustration />
          <div>
            <span className="eyebrow">YOUR NEXT IDEA IS WAITING</span>
            <h2>
              A fresh start.
              <br />A better edit.
            </h2>
            <button className="button button-mint" onClick={onStart}>
              Start creating <ArrowRight size={15} />
            </button>
          </div>
        </section>
      </main>
      <footer className="site-footer page-width">
        <a href="#" aria-label="Buffer home">
          <Brand />
        </a>
        <span>A little buffer for your creativity.</span>
        <span>© {new Date().getFullYear()} Buffer</span>
      </footer>
    </div>
  );
}
