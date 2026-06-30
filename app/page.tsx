'use client';
import { useEffect, useRef, useState } from 'react';

/* ── Particle Canvas ── */
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMove);

    const COLORS = ['#00ffff', '#a855f7', '#ec4899', '#22d3ee', '#818cf8'];
    const COUNT = 90;

    const particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      r: Math.random() * 2 + 1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx.beginPath();
            ctx.strokeStyle = particles[i].color + Math.floor((1 - dist / 130) * 40).toString(16).padStart(2, '0');
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }

        // Mouse connection
        const mdx = particles[i].x - mouseRef.current.x;
        const mdy = particles[i].y - mouseRef.current.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < 180) {
          ctx.beginPath();
          ctx.strokeStyle = particles[i].color + Math.floor((1 - mdist / 180) * 90).toString(16).padStart(2, '0');
          ctx.lineWidth = 0.8;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(mouseRef.current.x, mouseRef.current.y);
          ctx.stroke();
        }
      }

      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 6;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 opacity-60" />;
}

/* ── Cursor Glow ── */
function CursorGlow() {
  const [pos, setPos] = useState({ x: -200, y: -200 });
  useEffect(() => {
    const move = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);
  return (
    <div
      className="fixed w-[500px] h-[500px] rounded-full pointer-events-none z-[1] transition-transform duration-100 ease-out"
      style={{
        left: pos.x - 250,
        top: pos.y - 250,
        background: 'radial-gradient(circle, rgba(34,211,238,0.06) 0%, rgba(168,85,247,0.04) 40%, transparent 70%)',
      }}
    />
  );
}

/* ── Scroll Reveal Hook ── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return { ref, visible };
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
    >
      {children}
    </div>
  );
}

/* ── Typing Effect ── */
function TypingText({ texts }: { texts: string[] }) {
  const [idx, setIdx] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = texts[idx];
    const timeout = setTimeout(() => {
      if (!deleting) {
        if (displayed.length < current.length) {
          setDisplayed(current.slice(0, displayed.length + 1));
        } else {
          setTimeout(() => setDeleting(true), 1500);
        }
      } else {
        if (displayed.length > 0) {
          setDisplayed(displayed.slice(0, -1));
        } else {
          setDeleting(false);
          setIdx((idx + 1) % texts.length);
        }
      }
    }, deleting ? 50 : 100);
    return () => clearTimeout(timeout);
  }, [displayed, deleting, idx, texts]);

  return (
    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
      {displayed}<span className="animate-pulse text-cyan-400">|</span>
    </span>
  );
}

/* ── 3D Tilt Card ── */
function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState({});

  const handleMove = (e: React.MouseEvent) => {
    const card = ref.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;

    setStyle({
      transform: `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`,
    });
  };

  const reset = () => {
    setStyle({ transform: 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)' });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ transition: 'transform 0.15s ease-out', transformStyle: 'preserve-3d', ...style }}
      className={className}
    >
      {children}
    </div>
  );
}

/* ── Navbar ── */
function Navbar() {
  const links = ['Home', 'About', 'Projects', 'Skills', 'Contact'];
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-[#0a0a0f]/90 backdrop-blur-md border-b border-white/10 shadow-lg shadow-cyan-900/5' : 'bg-transparent'
    }`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <span className="font-mono text-cyan-400 font-bold tracking-widest text-sm hover:text-cyan-300 transition-colors cursor-default">
          AK.dev
        </span>
        <div className="flex gap-8">
          {links.map(l => (
            <a key={l} href={`#${l.toLowerCase()}`}
              className="text-sm text-gray-400 hover:text-cyan-400 transition-all duration-300 font-medium relative group">
              {l}
              <span className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-gradient-to-r from-cyan-400 to-purple-500 group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}

/* ── Hero ── */
function Hero() {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center px-6 pt-16 z-10">
      <div className="text-center max-w-3xl">
        <div className="inline-flex items-center gap-2 bg-cyan-950/40 border border-cyan-700/40 rounded-full px-4 py-1.5 text-xs text-cyan-300 font-mono mb-6 animate-[fadeUp_0.8s_ease_forwards] hover:scale-105 hover:border-cyan-500/60 transition-all cursor-default">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          Open to Full-time Roles
        </div>

        <p className="text-gray-400 text-lg mb-2 animate-[fadeUp_0.8s_ease_0.1s_forwards] opacity-0">Heya 👋, I'm</p>

        <h1 className="text-6xl md:text-7xl font-bold mb-4 animate-[fadeUp_0.8s_ease_0.2s_forwards] opacity-0">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-[length:200%_auto] animate-[gradientMove_4s_ease_infinite]">
            Arshdeep Kaur
          </span>
        </h1>

        <p className="text-xl text-gray-300 mb-4 font-medium h-8 animate-[fadeUp_0.8s_ease_0.3s_forwards] opacity-0">
  <TypingText texts={['Full Stack Developer', 'React.js Developer', 'Next.js Developer', 'MERN Stack Developer', 'Open to Opportunities']} />
</p>

        <p className="text-gray-500 text-sm max-w-lg mx-auto mb-10 animate-[fadeUp_0.8s_ease_0.4s_forwards] opacity-0">
          B.Tech CSE 2025 · Training at Nugen IT, Mohali · Building scalable apps with Next.js, TypeScript & MongoDB
        </p>

        <div className="flex gap-4 justify-center flex-wrap animate-[fadeUp_0.8s_ease_0.5s_forwards] opacity-0">
          <a href="#projects"
            className="bg-[#111] border border-white/10 hover:border-cyan-500/50 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-900/30">
            View Projects →
          </a>
          <a href="#contact"
            className="relative bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105 shadow-lg shadow-cyan-900/40 overflow-hidden group">
            <span className="relative z-10">Contact Me</span>
            <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </a>
          <a href="https://linkedin.com/in/arshdeep-kaur-dev" target="_blank"
            className="bg-[#111] border border-white/10 hover:border-purple-500/50 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-900/30">
            Resume 📄
          </a>
        </div>

        <div className="mt-16 flex justify-center animate-bounce opacity-60">
          <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-cyan-400 rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── About ── */
function About() {
  const stats = [
    { num: '2', label: 'Projects Built', color: 'text-cyan-400' },
    { num: '8+', label: 'Technologies', color: 'text-purple-400' },
    { num: '1yr', label: 'Training', color: 'text-pink-400' },
    { num: '100%', label: 'Dedication', color: 'text-cyan-400' },
  ];

  return (
    <section id="about" className="relative z-10 py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <Reveal>
          <SectionHeading label="About Me" title="Who am I?" />
        </Reveal>
        <div className="grid md:grid-cols-2 gap-12 items-center mt-12">
        <Reveal delay={100}>
  <div className="space-y-4 text-gray-400 text-sm leading-relaxed">
    <p>I'm a <span className="text-cyan-400 font-medium">B.Tech CSE graduate (2025)</span> currently undergoing professional training at <span className="text-cyan-400 font-medium">Nugen IT Services, Mohali</span>, where I build full-stack web applications using Next.js, React, TypeScript, and MongoDB.</p>
    <p>I prioritize writing clean, maintainable code — backed by <span className="text-purple-400 font-medium">Jest unit testing</span> and <span className="text-purple-400 font-medium">Cypress E2E testing</span> for production-level reliability.</p>
    <p>I'm also exploring AI-assisted development workflows using <span className="text-pink-400 font-medium">Claude AI</span> to build smarter, more efficient solutions.</p>
    <p>Currently open to full-time <span className="text-cyan-400 font-medium">Full Stack Developer</span> opportunities — let's build something impactful together.</p>
  </div>
</Reveal>

          <div className="grid grid-cols-2 gap-4">
            {stats.map((s, i) => (
              <Reveal key={s.label} delay={150 + i * 80}>
                <TiltCard className="bg-white/3 border border-white/8 rounded-2xl p-6 text-center hover:border-cyan-800/50 cursor-default">
                  <div className={`text-3xl font-bold ${s.color} mb-1`}>{s.num}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Projects ── */
function Projects() {
  const projects = [
    {
      name: 'CivicFix',
      tag: 'Full Stack',
      desc: 'Civic issue reporting platform with 3-role system (Citizen, Volunteer, Admin). Features voting, comments, notifications, real-time status tracking, and admin analytics dashboard.',
      tags: ['Next.js', 'TypeScript', 'MongoDB', 'Redux', 'Jest', 'Cypress'],
      live: 'https://civicfix-alpha.vercel.app/login',
      color: 'border-cyan-800/40',
      glow: 'hover:shadow-cyan-900/40',
    },
    {
      name: 'AlumniConnect',
      tag: 'Full Stack',
      desc: 'Alumni & placement portal with 2-role system (Alumni, TPO). Job referrals, events management, placement tracking, and analytics with salary & skill gap reports.',
      tags: ['Next.js', 'TypeScript', 'MongoDB', 'Redux', 'Jest', 'Cypress'],
      live: 'https://training-placement-portal-opal.vercel.app/',
      color: 'border-purple-800/40',
      glow: 'hover:shadow-purple-900/40',
    },
  ];

  return (
    <section id="projects" className="relative z-10 py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <Reveal>
          <SectionHeading label="Projects" title="What I've Built" />
        </Reveal>
        <div className="grid md:grid-cols-2 gap-6 mt-12">
          {projects.map((p, i) => (
            <Reveal key={p.name} delay={i * 150}>
              <TiltCard
                className={`bg-[#0d0d14] border ${p.color} rounded-2xl p-6 hover:shadow-2xl ${p.glow} cursor-default`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-500 bg-cyan-950/50 border border-cyan-800/30 rounded-full px-2 py-0.5 mr-2">{p.tag}</span>
                    <h3 className="text-lg font-bold text-white mt-2">{p.name}</h3>
                  </div>
                  <a href={p.live} target="_blank"
                    className="text-xs text-cyan-400 border border-cyan-800/50 rounded-full px-3 py-1 hover:bg-cyan-900/30 hover:scale-110 transition-all">
                    Live ↗
                  </a>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">{p.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {p.tags.map(t => (
                    <span key={t} className="font-mono text-[10px] text-cyan-300 bg-cyan-950/40 border border-cyan-800/30 rounded px-2 py-0.5 hover:bg-cyan-900/40 transition-colors">{t}</span>
                  ))}
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Skills ── */
function Skills() {
  const groups = [
    { label: 'Frontend', color: 'text-cyan-400', skills: ['React', 'Next.js', 'TypeScript', 'JavaScript', 'Redux', 'Tailwind CSS', 'HTML5', 'CSS3'] },
    { label: 'Backend & DB', color: 'text-purple-400', skills: ['Node.js', 'REST APIs', 'MongoDB', 'Next.js API Routes'] },
    { label: 'Testing', color: 'text-pink-400', skills: ['Jest', 'Cypress', 'Unit Testing', 'E2E Testing'] },
    { label: 'Tools', color: 'text-cyan-400', skills: ['Git', 'GitHub', 'VS Code', 'Claude AI', 'Python', 'C++'] },
  ];

  return (
    <section id="skills" className="relative z-10 py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <Reveal>
          <SectionHeading label="Skills" title="My Tech Stack" />
        </Reveal>
        <div className="grid md:grid-cols-2 gap-6 mt-12">
          {groups.map((g, i) => (
            <Reveal key={g.label} delay={i * 100}>
              <div className="bg-[#0d0d14] border border-white/8 rounded-2xl p-6 hover:border-cyan-800/40 transition-all duration-300 hover:-translate-y-1">
                <h3 className={`text-sm font-semibold ${g.color} font-mono mb-4`}>{g.label}</h3>
                <div className="flex flex-wrap gap-2">
                  {g.skills.map(s => (
                    <span key={s} className="text-xs text-gray-300 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 hover:border-cyan-700/50 hover:text-cyan-300 hover:scale-110 hover:-translate-y-0.5 transition-all duration-200 cursor-default">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Contact ── */
function Contact() {
  const [copied, setCopied] = useState(false);
  const copyEmail = () => {
    navigator.clipboard.writeText('adeepkaur727@email.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cards = [
    { label: 'Phone', value: '7279800055', icon: '📞', color: 'border-cyan-800/30' },
    { label: 'Email', value: 'adeepkaur727@email.com', icon: '✉️', color: 'border-purple-800/30' },
    { label: 'Location', value: 'Mohali, Punjab, India', icon: '📍', color: 'border-pink-800/30' },
    { label: 'Status', value: 'Open to Opportunities', icon: '🟢', color: 'border-cyan-800/30' },
  ];

  return (
    <section id="contact" className="relative z-10 py-24 px-6">
      <div className="max-w-5xl mx-auto text-center">
        <Reveal>
          <SectionHeading label="Contact" title="Let's Connect!" />
          <p className="text-gray-400 text-sm mt-4 mb-10 max-w-md mx-auto">
            Open to full-time Full Stack Developer roles. Feel free to reach out!
          </p>
        </Reveal>
        <Reveal delay={100}>
          <div className="flex gap-4 justify-center flex-wrap mb-12">
            <button onClick={copyEmail}
              className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-cyan-900/40">
              {copied ? '✓ Copied!' : '📋 Copy Email'}
            </button>
            <a href="https://linkedin.com/in/arshdeep-kaur-dev" target="_blank"
              className="bg-[#0d0d14] border border-white/10 hover:border-cyan-500/40 text-gray-300 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105">
              LinkedIn ↗
            </a>
            <a href="https://github.com/arsh00055" target="_blank"
              className="bg-[#0d0d14] border border-white/10 hover:border-purple-500/40 text-gray-300 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105">
              GitHub ↗
            </a>
          </div>
        </Reveal>
        <div className="grid md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
          {cards.map((c, i) => (
            <Reveal key={c.label} delay={200 + i * 100}>
              <TiltCard className={`bg-[#0d0d14] border ${c.color} rounded-xl p-4 cursor-default h-full`}>
                <div className="text-lg mb-1">{c.icon}</div>
                <div className="text-xs text-gray-500 mb-1 font-mono">{c.label}</div>
                <div className="text-sm text-gray-300 font-medium">{c.value}</div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Footer ── */
function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/5 py-8 text-center">
      <p className="text-gray-600 text-xs font-mono">
        Built with Next.js + Tailwind CSS · Arshdeep Kaur © 2025
      </p>
    </footer>
  );
}

/* ── Helper ── */
function SectionHeading({ label, title }: { label: string; title: string }) {
  return (
    <div className="text-center">
      <span className="font-mono text-xs text-cyan-500 tracking-widest uppercase border border-cyan-800/40 bg-cyan-950/30 rounded-full px-4 py-1 hover:border-cyan-500/60 transition-colors cursor-default">{label}</span>
      <h2 className="text-3xl font-bold mt-3 text-white">{title}</h2>
    </div>
  );
}

/* ── Main ── */
export default function Portfolio() {
  return (
    <main className="bg-[#0a0a0f] text-white min-h-screen relative">
      <ParticleCanvas />
      <CursorGlow />
      <Navbar />
      <Hero />
      <About />
      <Projects />
      <Skills />
      <Contact />
      <Footer />
    </main>
  );
}