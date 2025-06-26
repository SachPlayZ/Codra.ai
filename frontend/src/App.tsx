import Navigation from "./components/Navigation";
import DualCodeWindows from "./components/DualCodeWindows";
import FeatureCard from "./components/FeatureCard";
import { BlurFade } from "./components/ui/blur-fade";
import { GradientText } from "./components/ui/gradient-text";
import {
  MessageSquare,
  Globe,
  Users,
  Github,
  FileText,
  Layers,
  Video,
  CheckSquare,
  Clock,
  BarChart3,
  Rocket,
  Twitter,
  Linkedin,
  Zap,
  Brain,
  Target,
} from "lucide-react";
import { RainbowButton } from "./components/ui/rainbow-button";

function App() {
  const coreFeatures = [
    {
      icon: MessageSquare,
      title: "AI-Powered Chat Platform",
      description:
        "Intelligent brainstorming with context retention and seamless integration across all project modules.",
      gradient: "from-blue-500 to-teal-500",
    },
    {
      icon: Globe,
      title: "Smart Hackathon Dashboard",
      description:
        "Enter any hackathon URL and get complete event details scraped and organized automatically.",
      gradient: "from-teal-500 to-emerald-500",
    },
    {
      icon: Users,
      title: "Project Management Hub",
      description:
        "Create projects, invite teammates with codes, and maintain shared to-do lists effortlessly.",
      gradient: "from-emerald-500 to-green-500",
    },
    {
      icon: Github,
      title: "GitHub Integration",
      description:
        "Real-time monitoring of project developments with seamless version control integration.",
      gradient: "from-green-500 to-blue-500",
    },
    {
      icon: FileText,
      title: "Submission Helper",
      description:
        "Generate compelling submission answers based on your complete project context and requirements.",
      gradient: "from-blue-500 to-indigo-500",
    },
    {
      icon: Layers,
      title: "Tech Stack Suggester",
      description:
        "AI analyzes your project requirements and suggests the optimal technology stack for success.",
      gradient: "from-indigo-500 to-purple-500",
    },
  ];

  const premiumFeatures = [
    {
      icon: Video,
      title: "Mentor Connect",
      description:
        "Access expert mentors with full project context through text and video calls directly from your dashboard.",
      gradient: "from-purple-500 to-pink-500",
      isPremium: true,
    },
  ];

  const aiFeatures = [
    {
      icon: CheckSquare,
      title: "AI To-Do Generator",
      description:
        "Automatically generate comprehensive task lists based on your project scope and timeline.",
      gradient: "from-pink-500 to-red-500",
    },
    {
      icon: Clock,
      title: "Time Management Tool",
      description:
        "Optimize your hackathon schedule with AI-powered time allocation and milestone tracking.",
      gradient: "from-red-500 to-orange-500",
    },
    {
      icon: BarChart3,
      title: "Priority Analytics",
      description:
        "Get insights on which aspects to prioritize based on hackathon tracks and judging criteria.",
      gradient: "from-orange-500 to-yellow-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900 text-gray-900 dark:text-white overflow-x-hidden transition-colors duration-300">
      {/* Enhanced background gradient effects */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse delay-2000 animate-float"></div>
      </div>

      <Navigation />

      {/* Enhanced Hero Section with Full-Width Draggable Windows */}
      <section
        id="home"
        className="relative min-h-screen flex items-center pt-16"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          {/* Content Grid - Text content only */}
          <div className="grid lg:grid-cols-12 gap-12 items-center relative z-10">
            {/* Left side - Enhanced with multicolor gradients */}
            <div className="lg:col-span-8 space-y-10">
              <div className="space-y-8">
                <BlurFade delay={0.25} inView>
                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                    <span className="bg-gradient-to-b from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                      Aura Farm Hackathons
                    </span>
                  </h1>
                </BlurFade>

                <BlurFade delay={0.25 * 2} inView>
                  <h2 className="text-2xl md:text-3xl font-light">
                    <span className="text-gray-900 dark:text-white">
                      Lock In, Build, Crash Out with{" "}
                    </span>
                    <GradientText className="text-2xl md:text-3xl font-light">
                      Codra
                    </GradientText>
                  </h2>
                </BlurFade>

                <BlurFade delay={0.25 * 3} inView>
                  <p className="text-gray-600 dark:text-gray-400 text-xl leading-relaxed max-w-2xl">
                    Whether it's a lame ahh ML Project or a group gooning sesh,
                    we've got you covered. Track down your project, get a
                    mentor, and build something that slaps. Getting that W is a
                    breeze.
                  </p>
                </BlurFade>
              </div>

              {/* Hero section button - single CTA */}
              <BlurFade delay={0.25 * 4} inView>
                <div className="flex justify-start">
                  <RainbowButton
                    onClick={() => (window.location.href = "#features")}
                  >
                    <Rocket className="w-5 h-5 mr-2" />
                    Start Building
                  </RainbowButton>
                </div>
              </BlurFade>
            </div>

            {/* Right side - Empty space for visual balance */}
            <div className="lg:col-span-4 hidden lg:block">
              {/* This space is intentionally left for visual balance */}
            </div>
          </div>

          {/* Full-Width Draggable Mac Windows - Positioned absolutely over entire hero section */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="pointer-events-auto">
              <DualCodeWindows />
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="features" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
              Core Platform{" "}
              <GradientText className="text-4xl md:text-5xl font-bold">
                {" "}
                Features
              </GradientText>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-xl max-w-3xl mx-auto">
              Everything you need to ideate, collaborate, and ship winning
              projects in record time.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coreFeatures.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                gradient={feature.gradient}
              />
            ))}
          </div>
        </div>
      </section>

      {/* AI-Powered Tools Section */}
      <section
        id="platform"
        className="py-20 bg-gradient-to-b from-transparent to-gray-200/20 dark:to-gray-900/20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
              AI-Powered{" "}
              <GradientText className="text-4xl pb-2 md:text-5xl font-bold">
                {" "}
                Intelligence
              </GradientText>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-xl max-w-3xl mx-auto">
              Let artificial intelligence handle the heavy lifting while you
              focus on building amazing projects.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {aiFeatures.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                gradient={feature.gradient}
              />
            ))}
          </div>

          {/* Premium Features */}
          <div className="text-center space-y-4 mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Premium{" "}
              <GradientText className="text-3xl md:text-4xl font-bold">
                {" "}
                Features
              </GradientText>
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
              Unlock advanced capabilities with direct access to expert mentors
              and premium AI tools.
            </p>
          </div>

          <div className="grid md:grid-cols-1 lg:grid-cols-1 gap-8 max-w-2xl mx-auto">
            {premiumFeatures.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                gradient={feature.gradient}
                isPremium={feature.isPremium}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Success Metrics Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
              Built for{" "}
              <GradientText className="text-4xl md:text-5xl font-bold">
                {" "}
                Winners
              </GradientText>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-xl max-w-3xl mx-auto">
              Join thousands of developers who are already winning hackathons
              with Codra.AI.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-white/60 dark:bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-300 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-700 transition-all duration-300 hover:scale-105 group">
              <Brain className="w-12 h-12 mx-auto mb-4 text-blue-400 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Smart Ideation
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                AI-powered brainstorming that understands context and generates
                winning project ideas.
              </p>
            </div>

            <div className="text-center p-8 bg-white/60 dark:bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-300 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-700 transition-all duration-300 hover:scale-105 group">
              <Target className="w-12 h-12 mx-auto mb-4 text-teal-400 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Strategic Planning
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Automated project planning with timeline optimization and
                resource allocation.
              </p>
            </div>

            <div className="text-center p-8 bg-white/60 dark:bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-300 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-700 transition-all duration-300 hover:scale-105 group">
              <Zap className="w-12 h-12 mx-auto mb-4 text-emerald-400 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Rapid Execution
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Streamlined development workflow with real-time collaboration
                and progress tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-300 dark:border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <GradientText className="text-xl font-bold">Codra.AI</GradientText>

            <div className="flex space-x-6">
              <a
                href="#"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group"
              >
                <Twitter className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              </a>
              <a
                href="#"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group"
              >
                <Github className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              </a>
              <a
                href="#"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group"
              >
                <Linkedin className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              </a>
            </div>

            <div className="text-gray-600 dark:text-gray-400 text-sm">
              © 2025 Codra.AI. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
