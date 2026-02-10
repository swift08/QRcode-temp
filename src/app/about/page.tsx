import Link from 'next/link';
import { Shield, Heart, Users, RefreshCw, ArrowLeft } from 'lucide-react';
import { PageMotion } from '@/components/PageMotion';
import { MotionSection } from '@/components/MotionSection';
import { Card3D } from '@/components/Card3D';
import { GlassCard } from '@/components/GlassCard';

export const metadata = {
  title: 'About Us | kavach',
  description: 'KAVACH is a safety and trust platform designed for real-world situations.',
};

export default function AboutPage() {
  return (
    <PageMotion className="min-h-screen bg-background text-foreground">
      <header className="bg-[#1F2428]/95 backdrop-blur border-b border-[#2B3136] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center justify-center w-9 h-9 rounded-full bg-[#2B3136] text-[#B7BEC4] hover:bg-[#3A3F45] transition-colors"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#0F7A5A]" />
            <h1 className="text-lg font-semibold tracking-tight text-white">
              About Kavach
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 pb-20 space-y-16">
        {/* Hero / Story card with subtle 3D */}
        <MotionSection stagger staggerDelay={0.08} className="space-y-6">
          <Card3D
            tilt
            lift
            className="rounded-[32px] border border-[#2B3136] bg-[#2B3136] px-6 sm:px-10 py-8 sm:py-10 shadow-3d relative overflow-hidden"
          >
            <div className="absolute inset-x-0 -top-24 h-40 bg-gradient-to-r from-[#0F3D2E]/35 via-transparent to-[#0F3D2E]/15 blur-3xl pointer-events-none" />
            <div className="relative flex flex-col md:flex-row gap-8 md:gap-10 items-start">
              <div className="space-y-3 md:flex-1">
                <p className="text-xs font-semibold tracking-[0.24em] uppercase text-[#B7BEC4]">
                  Our story
                </p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white leading-tight">
                  Technology that speaks when you can&apos;t.
                </h2>
                <p className="text-sm sm:text-base text-[#B7BEC4] leading-relaxed">
                  KAVACH is a safety and trust platform designed for real-world emergencies—where
                  quick access to the right information can make all the difference. Built for the
                  realities of India, it enables instant access to critical safety information while
                  preserving privacy and dignity.
                </p>
                <p className="text-sm sm:text-base text-[#B7BEC4] leading-relaxed">
                  Whether used by individuals, families, communities or workplaces, KAVACH works as
                  a quiet layer of protection—always available, never intrusive. At its core, it is
                  about taking care of the people who matter most.
                </p>
              </div>
              <div className="md:w-64 w-full space-y-4">
                <GlassCard className="p-4 sm:p-5 bg-[#1F2428] text-white border-[#2B3136]">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="w-5 h-5 text-[#1F7A5A]" />
                    <p className="text-xs font-semibold tracking-[0.22em] uppercase text-[#B7BEC4]">
                      What we stand for
                    </p>
                  </div>
                  <p className="text-sm text-[#E5F6F0] leading-relaxed">
                    We believe that safety should not depend on luck. It should be engineered—with
                    empathy, clarity and respect for privacy.
                  </p>
                </GlassCard>
                <div className="grid grid-cols-2 gap-3 text-xs text-[#B7BEC4]">
                  <GlassCard className="p-3 bg-[#2B3136] border-[#3A3F45]">
                    <p className="font-semibold text-white mb-1">
                      Built for India
                    </p>
                    <p className="text-[11px] leading-snug text-[#B7BEC4]">
                      Designed around Indian roads, families & workplaces.
                    </p>
                  </GlassCard>
                  <GlassCard className="p-3 bg-[#2B3136] border-[#3A3F45]">
                    <p className="font-semibold text-white mb-1">
                      Privacy first
                    </p>
                    <p className="text-[11px] leading-snug text-[#B7BEC4]">
                      Help moves fast while personal details stay protected.
                    </p>
                  </GlassCard>
                </div>
              </div>
            </div>
          </Card3D>
        </MotionSection>

        {/* Vision / Mission / Purpose */}
        <MotionSection stagger staggerDelay={0.09} className="space-y-8">
          <div className="text-center space-y-2">
            <p className="text-xs font-semibold tracking-[0.24em] uppercase text-[#B7BEC4]">
              Why we exist
            </p>
            <h2 className="text-xl sm:text-2xl font-semibold text-white">
              Reducing silence between emergencies and action.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            <GlassCard className="p-5 sm:p-6 bg-[#2B3136] border-[#3A3F45]">
              <h3 className="text-sm font-semibold text-white mb-2">
                Our purpose
              </h3>
              <p className="text-xs sm:text-sm text-[#B7BEC4] leading-relaxed">
                To reduce emergency response time, improve accountability and save lives—without
                adding complexity or compromising privacy.
              </p>
            </GlassCard>
            <GlassCard className="p-5 sm:p-6 bg-[#2B3136] border-[#3A3F45]">
              <h3 className="text-sm font-semibold text-white mb-2">
                Our vision
              </h3>
              <p className="text-xs sm:text-sm text-[#B7BEC4] leading-relaxed">
                A world where no life is lost because someone could not be reached in time—and where
                every journey carries an invisible safety shield.
              </p>
            </GlassCard>
            <GlassCard className="p-5 sm:p-6 bg-[#2B3136] border-[#3A3F45]">
              <h3 className="text-sm font-semibold text-white mb-2">
                Our mission
              </h3>
              <p className="text-xs sm:text-sm text-[#B7BEC4] leading-relaxed">
                To engineer faster emergency response through simple, human‑centered technology that
                connects people within seconds when it matters most.
              </p>
            </GlassCard>
          </div>
        </MotionSection>

        {/* Dynamic information updates */}
        <MotionSection
          stagger
          staggerDelay={0.08}
          className="grid md:grid-cols-[1.1fr_minmax(0,0.9fr)] gap-6 items-stretch"
        >
          <GlassCard className="p-6 sm:p-7 bg-[#2B3136] border-[#3A3F45]">
            <h2 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2 mb-4">
              <RefreshCw className="w-4 h-4 text-[#1F7A5A]" />
              Information Updates & Management
            </h2>
            <p className="text-sm text-[#B7BEC4] mb-3">
              KAVACH is designed for changing real-life situations—because phone numbers, health
              conditions and responsibilities don&apos;t stay the same forever.
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-[#B7BEC4]">
              <li>Information can be updated instantly without replacing physical tags</li>
              <li>No need to reprint or redistribute identifiers</li>
              <li>Changes take effect in real time on every scan</li>
            </ul>
            <p className="text-sm text-[#B7BEC4] mt-4">
              This ensures that safety information is always current, accurate and reliable when
              someone is trying to help.
            </p>
          </GlassCard>

          <Card3D
            tilt
            lift
            className="rounded-2xl border border-dashed border-[#145A3A] bg-[#1F3A30] px-5 py-6 flex flex-col justify-between"
          >
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">
                Safety that stays in sync.
              </h3>
              <p className="text-xs sm:text-sm text-[#E5F6F0] leading-relaxed">
                Update once, and every QR instantly reflects the latest instructions, contacts and
                medical notes—without touching a single sticker.
              </p>
            </div>
            <p className="mt-4 text-[11px] text-[#B7BEC4] uppercase tracking-[0.18em]">
              Always accurate · Always ready
            </p>
          </Card3D>
        </MotionSection>

        {/* Families & workplaces */}
        <MotionSection stagger staggerDelay={0.08} className="grid md:grid-cols-2 gap-6">
          <GlassCard className="p-6 sm:p-7 bg-[#2B3136]">
            <h2 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2 mb-4">
              <Heart className="w-4 h-4 text-[#1F7A5A]" />
              Built for Families & Loved Ones
            </h2>
            <p className="text-sm text-[#B7BEC4] mb-3">
              In today&apos;s world, safety is no longer something we can assume—it&apos;s something
              we must actively care for.
            </p>
            <p className="text-sm text-[#B7BEC4] mb-3">
              For families, safety means knowing that parents, children, elders and loved ones can
              access help when they need it—today, tomorrow and in the future. KAVACH supports this
              responsibility without fear, dependence or constant monitoring.
            </p>
            <p className="text-sm text-[#B7BEC4] font-medium mb-2">
              KAVACH helps families:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-[#B7BEC4] mb-4">
              <li>Reach help faster during emergencies</li>
              <li>Share essential information without exposing personal details</li>
              <li>Stay prepared without tracking, surveillance or intrusion</li>
              <li>Build long-term peace of mind for every stage of life</li>
            </ul>
            <p className="text-sm text-[#B7BEC4] italic">
              It&apos;s not about control. It&apos;s about care, preparedness and trust—so families
              can focus on living, knowing protection is already in place.
            </p>
          </GlassCard>

          <GlassCard className="p-6 sm:p-7 bg-[#2B3136]">
            <h2 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-[#1F7A5A]" />
              Built for Communities & Workplaces
            </h2>
            <p className="text-sm text-[#B7BEC4] mb-3">
              Communities and workplaces depend on people moving safely, reliably and responsibly
              every day.
            </p>
            <p className="text-sm text-[#B7BEC4] mb-3">
              Whether it&apos;s shared spaces, daily operations or workplace fleets, safety systems
              must be dependable, easy to use and respectful of privacy. KAVACH helps protect what
              matters most—their people and the assets that keep everything running.
            </p>
            <p className="text-sm text-[#B7BEC4] font-medium mb-2">
              KAVACH helps communities and workplaces:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-[#B7BEC4] mb-4">
              <li>Improve emergency response without operational friction</li>
              <li>Maintain accountability without constant supervision</li>
              <li>Protect critical assets while prioritizing human safety</li>
              <li>Adapt easily to changing people, roles and situations</li>
            </ul>
            <p className="text-sm text-[#B7BEC4]">
              By simplifying safety and removing complexity, KAVACH enables organizations and
              communities to operate with greater confidence and care.
            </p>
          </GlassCard>
        </MotionSection>

        {/* Closing strip */}
        <MotionSection
          variants={{
            hidden: { opacity: 0, y: 16 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.4, ease: [0.33, 1, 0.68, 1] },
            },
          }}
          className="relative"
        >
          <GlassCard className="p-6 sm:p-7 bg-[#1F3A30] border-[#145A3A]">
            <h2 className="text-sm sm:text-base font-semibold text-white mb-3">
              🌱 Safety That Grows With You
            </h2>
            <p className="text-sm text-[#E5F6F0] leading-relaxed">
              KAVACH is built to evolve—with families, communities and workplaces alike. As lives
              change and responsibilities grow, KAVACH remains a steady foundation for safety,
              trust and preparedness—quiet in the background, powerful when it&apos;s needed most.
            </p>
          </GlassCard>
        </MotionSection>
      </main>
    </PageMotion>
  );
}
