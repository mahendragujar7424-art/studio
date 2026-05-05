
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { AIDescriptionTool } from "@/components/AIDescriptionTool";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Github, 
  Linkedin, 
  Twitter, 
  Mail, 
  Phone, 
  MapPin, 
  ExternalLink, 
  Code, 
  Figma, 
  Layout, 
  Cpu, 
  Smartphone,
  Quote,
  ArrowRight,
  CircleCheck,
  Paintbrush,
  Sparkles,
  Zap
} from "lucide-react";

// Custom SVGs for icons not present in Lucide
const Behance = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M9 12h2.5" />
    <path d="M9 10h2.5" />
    <path d="M15 10h3" />
    <path d="M3 7h5a3 3 0 0 1 0 6H3V7Z" />
    <path d="M3 13h5a3 3 0 0 1 0 6H3v-6Z" />
    <path d="M14 13a3 3 0 1 0 6 0v-4h-6v4Z" />
  </svg>
);

const Dribbble = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M8.5 2.8c3.5 1.5 6 4.5 7 8.5" />
    <path d="M5 15.5c2 0 3.5-2 4.5-4.5" />
    <path d="M14 7.5c-2 0-3.5 2-4.5 4.5" />
    <path d="M15.5 21.2c-3.5-1.5-6-4.5-7-8.5" />
  </svg>
);

export default function Home() {
  const avatarImage = PlaceHolderImages.find(img => img.id === "avatar")!;
  
  const projects = [
    {
      id: "project-1",
      title: "Vivid Ecommerce",
      description: "A high-conversion fashion retail platform with a seamless checkout experience and intuitive navigation.",
      tags: ["Web Design", "Shopify", "UI/UX"],
      image: PlaceHolderImages.find(img => img.id === "project-1")?.imageUrl || "https://picsum.photos/seed/p1/600/400"
    },
    {
      id: "project-2",
      title: "SaaS Analytics Dashboard",
      description: "Data-heavy interface for marketing professionals to track real-time campaign performance with precision.",
      tags: ["Dashboard", "React", "UX Research"],
      image: PlaceHolderImages.find(img => img.id === "project-2")?.imageUrl || "https://picsum.photos/seed/p2/600/400"
    },
    {
      id: "project-3",
      title: "Lume Mobile App",
      description: "A meditation and wellness app designed with a focus on accessibility and calm, modern aesthetics.",
      tags: ["Mobile App", "Figma", "iOS"],
      image: PlaceHolderImages.find(img => img.id === "project-3")?.imageUrl || "https://picsum.photos/seed/p3/600/400"
    },
    {
      id: "project-4",
      title: "Terra Architecture",
      description: "Minimalist portfolio site for a boutique architecture firm showcasing grand spatial projects and philosophy.",
      tags: ["Portfolio", "Branding", "GSAP"],
      image: PlaceHolderImages.find(img => img.id === "project-6")?.imageUrl || "https://picsum.photos/seed/p4/600/400"
    }
  ];

  const experience = [
    {
      role: "Senior Web Designer",
      company: "Waplia Digital Solutions",
      period: "2021 - Present",
      description: "Leading the design system initiative and overseeing UI/UX for major client deployments including global landing pages.",
      achievements: ["Increased conversion rates by 40% for primary clients", "Developed a scalable internal design system"]
    },
    {
      role: "UI/UX Designer",
      company: "Creative Pulse Agency",
      period: "2019 - 2021",
      description: "Crafted multi-platform design strategies and interactive prototypes for energetic startup ecosystems.",
      achievements: ["Delivered 20+ successful mobile app interfaces", "Voted Designer of the Year 2020"]
    }
  ];

  const skillGroups = [
    { name: "Figma", value: 95 },
    { name: "Adobe XD", value: 85 },
    { name: "Photoshop", value: 80 },
    { name: "HTML5/CSS3", value: 90 },
    { name: "JavaScript", value: 75 },
    { name: "Bootstrap/Tailwind", value: 90 }
  ];

  const testimonials = [
    {
      name: "Sarah Jenkins",
      title: "CEO at TechBloom",
      content: "Mahendra transformed our complex product into an intuitive experience. His eye for detail and design logic is unmatched.",
      avatar: "https://picsum.photos/seed/t1/100/100"
    },
    {
      name: "Robert Chen",
      title: "Marketing Lead at Waplia",
      content: "A designer who truly understands business goals. Mahendra doesn't just make things pretty; he makes them highly effective.",
      avatar: "https://picsum.photos/seed/t2/100/100"
    }
  ];

  return (
    <div className="min-h-screen bg-background font-body selection:bg-primary/30">
      <Navbar />

      <main className="relative">
        {/* Background Decorations */}
        <div className="absolute top-0 left-0 right-0 h-[1000px] hero-pattern pointer-events-none opacity-50 z-0" />
        <div className="absolute top-40 -left-20 w-80 h-80 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-80 -right-20 w-80 h-80 bg-accent/20 rounded-full blur-[120px] pointer-events-none" />

        {/* Hero Section */}
        <section id="home" className="relative pt-32 pb-20 md:pt-52 md:pb-40 overflow-hidden px-6">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 z-10 text-center lg:text-left">
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom duration-700 fill-mode-both">
                <Badge variant="secondary" className="px-4 py-1.5 text-primary font-semibold tracking-wide bg-primary/10 border-primary/20">
                  <Sparkles className="h-3.5 w-3.5 mr-2" />
                  AVAILABLE FOR NEW PROJECTS
                </Badge>
                <h1 className="text-5xl md:text-8xl font-bold tracking-tight font-headline">
                  Hi, I'm <span className="text-gradient">Mahendra</span>
                </h1>
                <h2 className="text-2xl md:text-4xl font-semibold text-muted-foreground font-headline">
                  Creative Web Designer
                </h2>
                <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Crafting beautiful, user-centric digital experiences at <span className="text-foreground font-bold underline decoration-primary/50 underline-offset-4 decoration-2">Waplia Digital Solutions</span>.
                </p>
              </div>
              <div className="flex flex-wrap justify-center lg:justify-start gap-5 animate-in fade-in slide-in-from-bottom duration-1000 delay-200 fill-mode-both">
                <Button size="lg" className="rounded-full px-10 h-14 text-lg shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all hover:scale-105" asChild>
                  <Link href="#portfolio" className="flex items-center gap-2">View Portfolio <ArrowRight className="h-5 w-5" /></Link>
                </Button>
                <Button size="lg" variant="outline" className="rounded-full px-10 h-14 text-lg border-2 hover:bg-primary/5 hover:border-primary/50 transition-all" asChild>
                  <Link href="#contact">Contact Me</Link>
                </Button>
              </div>
            </div>
            <div className="relative animate-in zoom-in duration-1000 fill-mode-both hidden lg:block">
              <div className="relative z-10 rounded-3xl overflow-hidden border-8 border-background shadow-2xl animate-float max-w-md mx-auto aspect-square group">
                <Image 
                  src={avatarImage.imageUrl} 
                  alt="Mahendra Portrait" 
                  fill 
                  priority
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  data-ai-hint="professional designer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              {/* Floating Decorative Elements */}
              <div className="absolute -top-10 -right-10 p-6 bg-card border rounded-2xl shadow-xl animate-bounce delay-75 z-20">
                <Figma className="h-8 w-8 text-[#F24E1E]" />
              </div>
              <div className="absolute -bottom-5 -left-10 p-6 bg-card border rounded-2xl shadow-xl animate-bounce delay-300 z-20">
                <Layout className="h-8 w-8 text-accent" />
              </div>
            </div>
          </div>
        </section>

        {/* About Me Section */}
        <section id="about" className="py-32 px-6 relative bg-secondary/10 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div className="space-y-8">
                <div className="space-y-4">
                  <h2 className="text-sm font-bold tracking-[0.2em] text-primary uppercase">About My Craft</h2>
                  <h3 className="text-4xl md:text-5xl font-bold font-headline leading-tight">Designing for the future, <span className="text-primary">one pixel</span> at a time.</h3>
                  <div className="w-20 h-1.5 bg-gradient-to-r from-primary to-accent rounded-full" />
                </div>
                <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                  <p>
                    With over 5 years of experience in the digital design realm, I specialize in creating interfaces that are as functional as they are beautiful. My philosophy is rooted in simplicity and user-driven decision making.
                  </p>
                  <p>
                    Working at <strong>Waplia Digital Solutions</strong>, I have the privilege of tackling complex design challenges for diverse industries, ensuring that every project is optimized for both aesthetics and performance.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-6 pt-4">
                  <div className="p-6 rounded-2xl bg-background border-2 border-primary/10 hover:border-primary/30 transition-colors shadow-sm">
                    <h4 className="text-4xl font-bold text-primary font-headline">5+</h4>
                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mt-1">Years Experience</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-background border-2 border-primary/10 hover:border-primary/30 transition-colors shadow-sm">
                    <h4 className="text-4xl font-bold text-primary font-headline">100+</h4>
                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mt-1">Projects Completed</p>
                  </div>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  { icon: Figma, label: "UI/UX Design", desc: "Crafting intuitive user journeys" },
                  { icon: Paintbrush, label: "Responsive Design", desc: "Fluid layouts for every screen" },
                  { icon: Code, label: "Frontend Dev", desc: "Bringing designs to life with code" },
                  { icon: Cpu, label: "Design Systems", desc: "Scalable visual languages" }
                ].map((item, idx) => (
                  <Card key={idx} className="group hover:border-primary/50 transition-all duration-300 p-8 flex flex-col items-start gap-4 shadow-none bg-background/50 backdrop-blur-md">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <h4 className="text-xl font-bold font-headline">{item.label}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Portfolio Section */}
        <section id="portfolio" className="py-32 px-6">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="flex flex-col md:flex-row justify-between items-end gap-8">
              <div className="space-y-4">
                <h2 className="text-sm font-bold tracking-[0.2em] text-primary uppercase">My Portfolio</h2>
                <h3 className="text-4xl md:text-5xl font-bold font-headline">Featured Projects</h3>
                <p className="text-muted-foreground max-w-md text-lg">Selected works that showcase my design expertise and creative problem solving.</p>
              </div>
              <Button variant="link" className="text-primary font-bold text-lg group p-0 h-auto hover:no-underline" asChild>
                <Link href="#" className="flex items-center gap-2">
                  See all work <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-10">
              {projects.map((project) => (
                <Card key={project.id} className="overflow-hidden card-hover-effect border-none bg-card/50">
                  <div className="relative aspect-[16/10] group overflow-hidden">
                    <Image 
                      src={project.image} 
                      alt={project.title} 
                      fill 
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      data-ai-hint="website ui design"
                    />
                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="p-8 space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="bg-primary/5 text-primary-foreground/70 border-primary/20 text-[10px] uppercase tracking-widest font-bold">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <h4 className="text-2xl font-bold font-headline">{project.title}</h4>
                    <p className="text-muted-foreground leading-relaxed">{project.description}</p>
                    <Button variant="outline" className="w-full rounded-full border-2 hover:bg-primary hover:text-white transition-all">
                      View Details
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* AI Tool Section */}
        <section className="py-32 px-6 bg-gradient-to-b from-primary/5 to-transparent relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[150px] -mr-48 -mt-48" />
          <div className="max-w-3xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-sm font-bold tracking-[0.2em] text-primary uppercase">Innovation Tools</h2>
              <h3 className="text-4xl font-bold font-headline">Experience the Magic</h3>
              <p className="text-muted-foreground text-lg">I use custom AI tools to streamline my workflow. Try this project description assistant I built.</p>
            </div>
            <AIDescriptionTool />
          </div>
        </section>

        {/* Work Experience Section */}
        <section id="experience" className="py-32 px-6 bg-secondary/5 relative">
          <div className="max-w-4xl mx-auto space-y-20">
             <div className="text-center space-y-4">
              <h2 className="text-sm font-bold tracking-[0.2em] text-primary uppercase">My Path</h2>
              <h3 className="text-4xl md:text-5xl font-bold font-headline">Work Experience</h3>
              <div className="w-20 h-1.5 bg-primary mx-auto rounded-full" />
            </div>

            <div className="space-y-16">
              {experience.map((item, idx) => (
                <div key={idx} className="relative pl-12 md:pl-20 group">
                  {/* Vertical line and dot */}
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-border group-last:bottom-auto group-last:h-4">
                    <div className="absolute top-0 left-[-7px] w-4 h-4 rounded-full bg-primary border-4 border-background transition-transform duration-300 group-hover:scale-125 shadow-lg shadow-primary/20" />
                  </div>
                  
                  <div className="space-y-4 bg-background p-8 rounded-3xl border shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-2xl font-bold font-headline group-hover:text-primary transition-colors">{item.role}</h4>
                        <p className="text-lg font-medium text-accent">@ {item.company}</p>
                      </div>
                      <span className="text-sm font-bold px-4 py-2 bg-primary/10 rounded-full text-primary border border-primary/20 h-fit whitespace-nowrap">
                        {item.period}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-lg leading-relaxed">{item.description}</p>
                    <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-dashed">
                      {item.achievements.map((achievement, i) => (
                        <div key={i} className="flex items-start gap-3 text-sm">
                          <CircleCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-foreground/80 font-medium">{achievement}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Skills Section */}
        <section id="skills" className="py-32 px-6 overflow-hidden">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-sm font-bold tracking-[0.2em] text-primary uppercase">Expertise</h2>
                <h3 className="text-4xl md:text-5xl font-bold font-headline">Skills & Technical Toolkit</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  My technical toolkit is ever-evolving. I focus on modern technologies and industry-standard design tools to deliver high-quality, professional results that convert.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-6">
                {[Figma, Paintbrush, Smartphone, Code, Cpu, Zap].map((Icon, i) => (
                  <div key={i} className="aspect-square flex flex-col items-center justify-center rounded-3xl bg-secondary/10 border-2 border-transparent hover:border-primary/30 hover:bg-background transition-all group shadow-sm">
                    <Icon className="h-10 w-10 text-primary group-hover:scale-125 transition-transform" />
                  </div>
                ))}
              </div>
            </div>
            <Card className="p-10 rounded-3xl border-2 shadow-2xl space-y-8 bg-background/50 backdrop-blur-md">
              {skillGroups.map((skill) => (
                <div key={skill.name} className="space-y-3">
                  <div className="flex justify-between text-sm font-bold uppercase tracking-wider">
                    <span>{skill.name}</span>
                    <span className="text-primary">{skill.value}%</span>
                  </div>
                  <Progress value={skill.value} className="h-2.5 bg-secondary/30" />
                </div>
              ))}
            </Card>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-32 px-6 bg-primary/5">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="text-center space-y-4">
              <h2 className="text-sm font-bold tracking-[0.2em] text-primary uppercase">Kind Words</h2>
              <h3 className="text-4xl md:text-5xl font-bold font-headline">What Clients Say</h3>
              <div className="w-20 h-1.5 bg-primary mx-auto rounded-full" />
            </div>
            <div className="grid md:grid-cols-2 gap-10">
              {testimonials.map((t, idx) => (
                <Card key={idx} className="bg-background border shadow-xl p-10 space-y-8 relative overflow-hidden group hover:border-primary/40 transition-all rounded-3xl">
                  <Quote className="absolute top-8 right-8 h-16 w-16 text-primary/5 group-hover:text-primary/10 transition-colors" />
                  <p className="text-xl italic leading-relaxed text-foreground/80 relative z-10 font-medium">"{t.content}"</p>
                  <div className="flex items-center gap-5 pt-8 border-t">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20 shadow-md">
                      <Image src={t.avatar} alt={t.name} fill className="object-cover" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold font-headline">{t.name}</h4>
                      <p className="text-sm text-primary font-semibold uppercase tracking-wider">{t.title}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-32 px-6 relative">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20">
            <div className="space-y-12">
              <div className="space-y-4">
                <h2 className="text-sm font-bold tracking-[0.2em] text-primary uppercase">Get In Touch</h2>
                <h3 className="text-4xl md:text-5xl font-bold font-headline">Let's Create Together</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Have a project in mind or just want to discuss some creative ideas? I'm always open to new design challenges and opportunities.
                </p>
              </div>

              <div className="grid gap-8">
                {[
                  { icon: Mail, label: "Email Me", value: "hello@mahendradesign.com" },
                  { icon: Phone, label: "Call Me", value: "+1 (555) 123-4567" },
                  { icon: MapPin, label: "Visit My Studio", value: "Waplia Digital Solutions, Tech Park" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-6 group">
                    <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-primary/10 group-hover:bg-primary transition-all duration-300">
                      <item.icon className="h-7 w-7 text-primary group-hover:text-primary-foreground transition-all" />
                    </div>
                    <div>
                      <p className="text-sm text-primary font-bold uppercase tracking-widest mb-1">{item.label}</p>
                      <p className="text-xl font-bold font-headline">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-6 pt-6">
                <p className="font-bold text-lg uppercase tracking-widest text-foreground/70">Follow My Creative Journey</p>
                <div className="flex gap-5">
                  {[
                    { icon: Linkedin, href: "#" },
                    { icon: Behance, href: "#" },
                    { icon: Dribbble, href: "#" },
                    { icon: Twitter, href: "#" }
                  ].map((social, i) => (
                    <Link key={i} href={social.href} className="w-14 h-14 flex items-center justify-center rounded-2xl border-2 border-primary/20 hover:border-primary hover:bg-primary hover:text-white transition-all transform hover:-translate-y-1 shadow-sm">
                      <social.icon className="h-6 w-6" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <Card className="bg-background/80 backdrop-blur-xl shadow-2xl border-2 rounded-3xl p-1 z-10 overflow-hidden">
              <CardContent className="p-10 space-y-8">
                <div className="grid sm:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">First Name</label>
                    <input className="w-full bg-secondary/20 border-2 border-transparent rounded-2xl p-4 outline-none focus:border-primary/50 focus:bg-background transition-all" placeholder="John" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Last Name</label>
                    <input className="w-full bg-secondary/20 border-2 border-transparent rounded-2xl p-4 outline-none focus:border-primary/50 focus:bg-background transition-all" placeholder="Doe" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
                  <input className="w-full bg-secondary/20 border-2 border-transparent rounded-2xl p-4 outline-none focus:border-primary/50 focus:bg-background transition-all" placeholder="john@example.com" />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Your Message</label>
                  <textarea rows={5} className="w-full bg-secondary/20 border-2 border-transparent rounded-2xl p-4 outline-none focus:border-primary/50 focus:bg-background transition-all resize-none" placeholder="Tell me about your amazing project..."></textarea>
                </div>
                <Button className="w-full h-16 text-xl font-bold rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all hover:scale-[1.02]">
                  Send Inquiry
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="py-20 border-t bg-secondary/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12 items-center text-center md:text-left">
            <div className="space-y-4">
              <Link href="#home" className="text-3xl font-headline font-bold text-primary">
                Mahendra<span className="text-foreground">.</span>
              </Link>
              <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto md:mx-0">
                Designing beautiful digital products and experiences for brands that care about quality.
              </p>
            </div>
            
            <nav className="flex flex-col md:flex-row gap-8 justify-center items-center text-sm font-bold uppercase tracking-widest">
              <Link href="#home" className="hover:text-primary transition-colors">Home</Link>
              <Link href="#about" className="hover:text-primary transition-colors">About</Link>
              <Link href="#portfolio" className="hover:text-primary transition-colors">Work</Link>
              <Link href="#contact" className="hover:text-primary transition-colors">Contact</Link>
            </nav>

            <div className="flex flex-col items-center md:items-end space-y-4">
              <div className="flex gap-6">
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors"><Linkedin className="h-6 w-6" /></Link>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors"><Behance className="h-6 w-6" /></Link>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors"><Dribbble className="h-6 w-6" /></Link>
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                © {new Date().getFullYear()} Mahendra Design Studio. Crafted with love.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
