import { useState, useCallback } from "react";
import {
  useTheme,
  FONT_MONO,
  FONT_SERIF,
  FONT_SIZES,
  SPACING,
  RADII,
} from "../../contexts/ThemeContext";

// ── Decision Scenarios ──
const SCENARIOS = [
  {
    id: "austria-1",
    nation: "austria",
    flag: "\u{1F1E6}\u{1F1F9}",
    name: "Austria-Hungary",
    color: "#D97706",
    bg: "#FEF3C7",
    title: "The Assassination",
    date: "June 28 \u2013 July 23, 1914",
    briefing:
      "Your Archduke \u2014 the heir to the throne \u2014 has been assassinated in Sarajevo by a Bosnian Serb with ties to Serbian nationalist groups. Your empire is a patchwork of ethnic groups already pushing for independence. If you look weak now, the empire could unravel. Serbia has been a thorn in your side for years. Your ally Germany has told you they\u2019ll back whatever you decide.",
    question:
      "The empire\u2019s prestige and survival may be at stake. How do you respond?",
    options: [
      {
        id: "a",
        label: "Issue a crushing ultimatum",
        short: "Ultimatum",
        desc: "Send Serbia a list of demands so extreme they\u2019ll have to reject at least some. When they do, you\u2019ll have justification for war.",
        historical: true,
      },
      {
        id: "b",
        label: "Demand an international investigation",
        short: "Investigation",
        desc: "Call for the great powers to jointly investigate Serbian involvement. Take the high road and build international support before acting.",
        historical: false,
      },
      {
        id: "c",
        label: "Accept Serbia\u2019s condemnation and move on",
        short: "Accept & move on",
        desc: "Serbia has already condemned the assassination publicly. Accept their sympathy, mourn your Archduke, and focus on internal stability.",
        historical: false,
      },
    ],
    historicalChoice: "a",
    reveal:
      "Austria-Hungary issued an ultimatum with 10 demands, several of which would have violated Serbian sovereignty. They gave Serbia 48 hours to respond. Remarkably, Serbia accepted 9 of the 10 demands \u2014 but Austria-Hungary declared war anyway on July 28.",
    whyRational:
      "Austria-Hungary wasn\u2019t just responding to an assassination \u2014 they were fighting for the empire\u2019s survival. If small nations could sponsor terrorism against great powers without consequences, every ethnic group in the empire would be emboldened. The ultimatum was designed to be rejected because Austria-Hungary had already decided that war with Serbia was the only way to reassert imperial authority. With Germany\u2019s blank check in hand, they felt safe.",
    whyOthersFailed: {
      b: "An international investigation would have taken months and likely produced ambiguous results. Meanwhile, the empire\u2019s credibility would continue to erode. Austria-Hungary\u2019s leaders believed delay was more dangerous than action.",
      c: "Accepting Serbia\u2019s condemnation without action would have signaled to every nationalist movement in the empire that violence against Habsburg leadership had no real consequences. The empire\u2019s own military leaders warned this would accelerate the breakup of Austria-Hungary.",
    },
    skillConnection:
      "Skill 7B \u2014 Explaining why someone holds a perspective. Austria-Hungary\u2019s leaders weren\u2019t irrational warmongers. They were empire managers watching their empire crack.",
  },
  {
    id: "germany-1",
    nation: "germany",
    flag: "\u{1F1E9}\u{1F1EA}",
    name: "Germany",
    color: "#374151",
    bg: "#F3F4F6",
    title: "The Blank Check",
    date: "July 5\u20136, 1914",
    briefing:
      "Austria-Hungary has come to you asking for support against Serbia. You know Russia considers itself the protector of Slavic nations and might intervene. France is allied with Russia. You\u2019re surrounded \u2014 France to the west, Russia to the east. Austria-Hungary is your most important ally, and possibly your only reliable one. If you lose them, you\u2019re isolated in Europe.",
    question:
      "Austria-Hungary wants to know: will you support them, no matter what they decide to do about Serbia?",
    options: [
      {
        id: "a",
        label: "Give unconditional support",
        short: "Blank check",
        desc: "Tell Austria-Hungary you\u2019ll back them completely \u2014 whatever they decide. Your alliance is too important to hedge.",
        historical: true,
      },
      {
        id: "b",
        label: "Support, but urge restraint",
        short: "Conditional support",
        desc: "Promise to defend them if attacked, but urge them to keep their response proportional. Try to prevent a wider war.",
        historical: false,
      },
      {
        id: "c",
        label: "Stay neutral",
        short: "Neutrality",
        desc: "This is Austria-Hungary\u2019s problem, not yours. A Balkan conflict isn\u2019t worth risking war with Russia and France.",
        historical: false,
      },
    ],
    historicalChoice: "a",
    reveal:
      "Kaiser Wilhelm II gave Austria-Hungary unconditional support \u2014 the infamous \u2018blank check.\u2019 Germany promised to back Austria-Hungary regardless of what they did, even if it meant war with Russia. The Kaiser reportedly said the matter should be \u2018settled at once.\u2019",
    whyRational:
      "Germany\u2019s strategic nightmare was a two-front war against France and Russia simultaneously. But that nightmare was coming regardless \u2014 Russia was industrializing rapidly, and every year that passed made Russia stronger. German military planners believed that if war was inevitable, it was better to fight it now while they still had an advantage. Supporting Austria-Hungary wasn\u2019t reckless \u2014 it was a calculated bet that a short, decisive war now was better than a losing war later.",
    whyOthersFailed: {
      b: "Urging restraint sounds wise, but Germany feared that if they constrained Austria-Hungary and the crisis fizzled, Austria-Hungary would lose faith in the alliance. An ally you can\u2019t count on isn\u2019t an ally. And the underlying problem \u2014 Russian growth \u2014 would still be there.",
      c: "Neutrality would have meant abandoning Germany\u2019s only major ally. If Austria-Hungary fell or switched sides, Germany would face France and Russia alone with no one at their back. For a nation already anxious about encirclement, abandoning their ally was strategic suicide.",
    },
    skillConnection:
      "Skill 1C \u2014 Consequences (intended vs. unintended). Germany intended to deter Russia by showing strength. The unintended consequence was enabling Austria-Hungary to start a war that pulled everyone in.",
  },
  {
    id: "russia-1",
    nation: "russia",
    flag: "\u{1F1F7}\u{1F1FA}",
    name: "Russia",
    color: "#1D4ED8",
    bg: "#DBEAFE",
    title: "The Protector\u2019s Dilemma",
    date: "July 28\u201330, 1914",
    briefing:
      "Austria-Hungary has declared war on Serbia. Serbia is a fellow Slavic nation that looks to you for protection. Your entire foreign policy in the Balkans is built on being the protector of Slavic peoples. If you abandon Serbia now, no small nation will trust you again. But mobilizing your army will almost certainly provoke Germany \u2014 and your army is enormous but slow. Full mobilization takes weeks. If you wait too long, you\u2019ll be caught unprepared.",
    question:
      "Austria-Hungary is attacking Serbia. Your generals are urging you to act. What do you do?",
    options: [
      {
        id: "a",
        label: "Full military mobilization",
        short: "Full mobilization",
        desc: "Order the entire Russian army to mobilize \u2014 against both Austria-Hungary and Germany. It\u2019s all or nothing. Partial mobilization would leave you vulnerable.",
        historical: true,
      },
      {
        id: "b",
        label: "Partial mobilization against Austria-Hungary only",
        short: "Partial mobilization",
        desc: "Mobilize only the forces facing Austria-Hungary. Signal that you\u2019re defending Serbia but not threatening Germany directly.",
        historical: false,
      },
      {
        id: "c",
        label: "Diplomatic protest only",
        short: "Diplomacy",
        desc: "Condemn Austria-Hungary\u2019s actions through diplomatic channels. Call for an international conference. Keep your army in its barracks.",
        historical: false,
      },
    ],
    historicalChoice: "a",
    reveal:
      "Tsar Nicholas II initially ordered partial mobilization, then reversed himself and ordered full mobilization on July 30. His generals had told him that partial mobilization was technically impossible \u2014 Russia\u2019s rail-based mobilization plans were all-or-nothing. You couldn\u2019t mobilize half an army when your train schedules were built to move the whole thing.",
    whyRational:
      "Russia\u2019s military planners had spent years building mobilization schedules around a single scenario: total war on two fronts. There was literally no plan for partial mobilization. The trains, the supply routes, the troop movements \u2014 all designed as one enormous coordinated machine. Tsar Nicholas wanted a measured response, but his own military infrastructure wouldn\u2019t allow it. And every day of delay gave Germany more time to prepare. Russia\u2019s army was the largest in Europe but the slowest to mobilize. Starting late could be fatal.",
    whyOthersFailed: {
      b: "Tsar Nicholas actually tried this first. His generals told him it was impossible \u2014 the mobilization plans didn\u2019t have a \u2018partial\u2019 option. Trying to improvise a partial mobilization would create chaos in the rail system and leave Russia dangerously disorganized if full war came anyway.",
      c: "Diplomatic protest without military action would have meant watching Serbia be destroyed while Russia did nothing. Every Slavic nation in the Balkans would conclude that Russian protection was worthless. Russia\u2019s entire strategic position in southeastern Europe would collapse \u2014 and they\u2019d still face the same German threat with fewer allies.",
    },
    skillConnection:
      "Skill 1B \u2014 Identifying multiple causes. Russia\u2019s mobilization wasn\u2019t caused by one thing. Pan-Slavic ideology, alliance obligations, military infrastructure limitations, and fear of German speed all combined.",
  },
  {
    id: "germany-2",
    nation: "germany",
    flag: "\u{1F1E9}\u{1F1EA}",
    name: "Germany",
    color: "#374151",
    bg: "#F3F4F6",
    title: "The Schlieffen Plan",
    date: "August 1\u20133, 1914",
    briefing:
      "You\u2019ve declared war on Russia. But here\u2019s your nightmare: France and Russia are allies. You\u2019re about to face a two-front war. Russia\u2019s army is enormous but slow to mobilize \u2014 it\u2019ll take them 6 weeks to fully deploy. France\u2019s army is smaller but can mobilize in 2 weeks. You have a plan, developed years ago by Count von Schlieffen: knock France out in 6 weeks before Russia is ready, then turn east. But the plan requires attacking France through Belgium \u2014 a neutral country whose neutrality is guaranteed by Britain.",
    question:
      "The clock is ticking. Russia is mobilizing. France is mobilizing. You have one war plan. What do you do?",
    options: [
      {
        id: "a",
        label: "Execute the Schlieffen Plan \u2014 invade through Belgium",
        short: "Invade Belgium",
        desc: "Speed is everything. The plan exists for a reason. Go through Belgium, knock out France in 6 weeks, then deal with Russia. Yes, it violates Belgian neutrality. Yes, Britain might intervene. But there\u2019s no alternative.",
        historical: true,
      },
      {
        id: "b",
        label: "Attack France directly along the shared border",
        short: "Direct attack",
        desc: "Avoid violating Belgian neutrality by attacking through the heavily fortified Franco-German border. It\u2019ll be harder and slower, but Britain stays out.",
        historical: false,
      },
      {
        id: "c",
        label: "Fight defensively on both fronts",
        short: "Defend only",
        desc: "Dig in on both borders. Let France and Russia come to you. Fighting defensive wars on your own territory is easier than attacking on two fronts.",
        historical: false,
      },
    ],
    historicalChoice: "a",
    reveal:
      "Germany executed the Schlieffen Plan, invading Belgium on August 3. When asked about the Treaty of London guaranteeing Belgian neutrality, German Chancellor Bethmann-Hollweg called it \u2018a scrap of paper.\u2019 German forces swept through Belgium toward Paris \u2014 but the plan ultimately failed when French and British forces stopped them at the Battle of the Marne in September.",
    whyRational:
      "Germany\u2019s military had been planning for a two-front war for over a decade, and every simulation told them the same thing: fighting France and Russia simultaneously was unwinnable unless you eliminated one quickly. The Franco-German border was one of the most heavily fortified regions in the world \u2014 a direct attack would be a bloodbath with no guarantee of speed. Belgium was the only path to a quick victory. German planners knew it would anger Britain, but they gambled that either Britain wouldn\u2019t intervene, or that France would be defeated before British forces could arrive in significant numbers.",
    whyOthersFailed: {
      b: "The Franco-German border was lined with fortresses on both sides. A direct attack would turn into a grinding siege \u2014 exactly the kind of slow war Germany couldn\u2019t afford with Russia mobilizing in the east. The Schlieffen Plan existed precisely because the direct route was considered suicidal.",
      c: "Defensive war sounds rational, but Germany\u2019s generals believed time worked against them. Every week that passed, Russia\u2019s massive army got more organized. If Germany waited, they\u2019d eventually face Russia\u2019s full strength in the east AND a fully mobilized France in the west. The whole strategy was built on speed \u2014 and defense is the opposite of speed.",
    },
    skillConnection:
      "Skill 1C \u2014 Consequences. Germany intended to win a quick war. The unintended consequence was bringing Britain into the conflict, creating the Western Front, and turning a continental crisis into a world war.",
  },
  {
    id: "britain-1",
    nation: "britain",
    flag: "\u{1F1EC}\u{1F1E7}",
    name: "Britain",
    color: "#059669",
    bg: "#D1FAE5",
    title: "The Treaty and the Balance",
    date: "August 4, 1914",
    briefing:
      "Germany has invaded Belgium. You signed the Treaty of London in 1839 guaranteeing Belgian neutrality \u2014 but that was 75 years ago. The treaty doesn\u2019t technically require you to act alone. Meanwhile, France \u2014 your Entente partner \u2014 is under attack. If Germany defeats France, they\u2019ll dominate continental Europe. Your navy rules the seas, but your army is small compared to the continental powers. Getting involved means sending troops to fight in a European land war \u2014 something Britain has traditionally avoided.",
    question:
      "Germany is in Belgium. France is under attack. The treaty is old but valid. What do you do?",
    options: [
      {
        id: "a",
        label: "Declare war on Germany",
        short: "Declare war",
        desc: "Honor the Treaty of London. Defend Belgian neutrality. Support France. If Germany dominates Europe, Britain\u2019s security is threatened anyway.",
        historical: true,
      },
      {
        id: "b",
        label: "Condemn Germany but stay out",
        short: "Condemn only",
        desc: "Issue a strong diplomatic protest. The treaty is 75 years old and doesn\u2019t require solo action. This isn\u2019t Britain\u2019s fight \u2014 let the continental powers sort it out.",
        historical: false,
      },
      {
        id: "c",
        label: "Offer to mediate a ceasefire",
        short: "Mediate",
        desc: "Position yourself as the neutral peacemaker. Propose an immediate ceasefire and international conference. Use your diplomatic prestige to stop the war before it escalates.",
        historical: false,
      },
    ],
    historicalChoice: "a",
    reveal:
      "Britain issued an ultimatum to Germany: withdraw from Belgium by midnight on August 4, or face war. Germany did not respond. Britain declared war. Foreign Secretary Sir Edward Grey reportedly looked out his window that evening and said, \u2018The lamps are going out all over Europe. We shall not see them lit again in our lifetime.\u2019",
    whyRational:
      "Britain had two reasons, one public and one strategic. Publicly, the Treaty of London gave Britain a clear moral and legal justification \u2014 Germany had violated the neutrality of a small nation that Britain had sworn to protect. Strategically, Britain could not allow Germany to dominate continental Europe. A German-controlled Belgium would put German forces directly across the English Channel. A defeated France would leave Germany as the unchallenged power in Europe. Britain had spent centuries preventing any single nation from dominating the continent. Staying out would have meant abandoning that core principle.",
    whyOthersFailed: {
      b: "Diplomatic condemnation without action would have been meaningless. Germany had already called the treaty \u2018a scrap of paper.\u2019 If Britain let that stand, every treaty Britain had signed became equally worthless \u2014 and Britain\u2019s global empire was held together by treaties. Beyond that, a German-dominated continent would eventually threaten British trade routes and naval supremacy.",
      c: "Mediation requires both sides to want to stop. By August 4, armies were already marching. Germany was executing a plan that depended on speed \u2014 they had no incentive to pause. Russia was mobilized and couldn\u2019t easily stop. The window for diplomacy had closed weeks earlier. Offering mediation now would look like weakness, not wisdom.",
    },
    skillConnection:
      "Skill 7A \u2014 Identifying a different perspective. Britain\u2019s entry looks inevitable in hindsight, but Parliament was genuinely divided. The Belgian invasion gave interventionists the moral argument they needed to overcome isolationist resistance.",
  },
  {
    id: "ottoman-1",
    nation: "ottoman",
    flag: "\u{1F3F3}\u{FE0F}",
    name: "Ottoman Empire",
    color: "#B91C1C",
    bg: "#FEE2E2",
    title: "The Opportunist\u2019s Gamble",
    date: "August \u2013 November 1914",
    briefing:
      "You are the \u2018sick man of Europe.\u2019 Your empire has been shrinking for decades \u2014 you\u2019ve lost territory in the Balkans, North Africa, and the Mediterranean. Russia is your oldest enemy, always pushing to control the straits that connect the Black Sea to the Mediterranean. Britain and France have shown little interest in propping you up. Germany, however, has been building a relationship: military advisors, railroad investments, diplomatic warmth. A European war might be your chance to reclaim lost territory \u2014 or it might be the blow that finally destroys your empire.",
    question:
      "Europe is at war. Both sides want your support \u2014 or at least your neutrality. What do you do?",
    options: [
      {
        id: "a",
        label: "Join the Central Powers",
        short: "Join Germany",
        desc: "Ally with Germany and Austria-Hungary. If they win, you can reclaim territory from Russia and reassert power in the region. Germany has been your most reliable partner.",
        historical: true,
      },
      {
        id: "b",
        label: "Join the Entente",
        short: "Join Britain/France",
        desc: "Side with Britain, France, and Russia. They\u2019re the established powers. If they win, maybe they\u2019ll reward your loyalty with territorial guarantees.",
        historical: false,
      },
      {
        id: "c",
        label: "Stay neutral",
        short: "Neutrality",
        desc: "Sit this out entirely. Your empire is fragile. A war could break you. Let the Europeans fight each other and pick up the pieces afterward.",
        historical: false,
      },
    ],
    historicalChoice: "a",
    reveal:
      "The Ottoman Empire signed a secret alliance with Germany on August 2, 1914, and formally entered the war in late October by launching a naval attack on Russian ports in the Black Sea. The decision was driven largely by War Minister Enver Pasha and a pro-German faction within the government \u2014 it was not unanimous.",
    whyRational:
      "The Ottoman Empire\u2019s leaders saw the war as a now-or-never moment. Russia was their existential threat \u2014 for centuries, Russia had been expanding southward toward Ottoman territory and the strategically vital Turkish Straits. Britain and France had shown no interest in protecting Ottoman interests; in fact, they\u2019d been carving up Ottoman territories for decades. Germany offered military modernization, respect as an equal partner, and a shared enemy in Russia. If the Central Powers won, the Ottomans could reclaim lost territories in the Caucasus and Central Asia. It was a gamble \u2014 but the status quo was slow death anyway.",
    whyOthersFailed: {
      b: "Russia was the Ottoman Empire\u2019s greatest enemy. Joining an alliance that included Russia would be like joining forces with the country most likely to dismember you. And Britain and France had already demonstrated their willingness to take Ottoman territory \u2014 France controlled North Africa, Britain controlled Egypt. The Entente had no credible offer to make.",
      c: "Neutrality meant watching the war\u2019s outcome without influence. If the Central Powers won, the Ottomans would have missed their chance to reclaim territory. If the Entente won, they\u2019d carve up the Ottoman Empire regardless \u2014 which is exactly what happened after the war. Neutrality guaranteed irrelevance.",
    },
    skillConnection:
      "Skill 1B \u2014 Identifying multiple causes. The Ottoman entry wasn\u2019t about one alliance or one event. It was about a declining empire making a desperate strategic calculation based on centuries of rivalry with Russia, decades of European colonialism, and a brief window of German partnership.",
  },
];

// ── Helpers ──
function getGradeText(isHistorical) {
  return isHistorical
    ? "You chose what they actually did."
    : "They chose differently. Here\u2019s why.";
}

// ── Sub-components ──

function BriefingScreen({ scenario, onChoose, theme, dark }) {
  const [selected, setSelected] = useState(null);
  const [hoveredOption, setHoveredOption] = useState(null);

  return (
    <div>
      {/* Briefing header */}
      <div
        style={{
          background: `${scenario.color}10`,
          border: `2px solid ${scenario.color}30`,
          borderRadius: RADII["2xl"],
          padding: `${SPACING[5]} ${SPACING[6]}`,
          marginBottom: SPACING[4],
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: SPACING["2.5"],
            marginBottom: SPACING[2],
          }}
        >
          <span style={{ fontSize: 36 }}>{scenario.flag}</span>
          <div>
            <div
              style={{
                fontSize: FONT_SIZES.micro,
                fontWeight: 700,
                color: scenario.color,
                fontFamily: FONT_MONO,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              You are {scenario.name}
            </div>
            <div
              style={{
                fontSize: FONT_SIZES.micro,
                color: theme.textSecondary,
                fontFamily: FONT_MONO,
              }}
            >
              {scenario.date}
            </div>
          </div>
        </div>
        <h2
          style={{
            fontSize: FONT_SIZES.xl,
            fontWeight: 700,
            margin: `0 0 ${SPACING["2.5"]} 0`,
            fontFamily: FONT_SERIF,
            color: theme.textPrimary,
          }}
        >
          {scenario.title}
        </h2>
        <p
          style={{
            fontSize: FONT_SIZES.base,
            lineHeight: 1.75,
            color: theme.textDescription,
            margin: 0,
            fontFamily: FONT_SERIF,
          }}
        >
          {scenario.briefing}
        </p>
      </div>

      {/* Question */}
      <div
        style={{
          fontSize: FONT_SIZES.md,
          fontWeight: 700,
          color: theme.textPrimary,
          fontFamily: FONT_SERIF,
          marginBottom: SPACING[3],
          padding: `0 ${SPACING[1]}`,
        }}
      >
        {scenario.question}
      </div>

      {/* Options */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: SPACING["2.5"],
          marginBottom: SPACING[4],
        }}
      >
        {scenario.options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setSelected(opt.id)}
            onMouseEnter={() => setHoveredOption(opt.id)}
            onMouseLeave={() => setHoveredOption(null)}
            style={{
              padding: `${SPACING[4]} ${SPACING[5]}`,
              borderRadius: RADII["2xl"],
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.2s",
              background:
                selected === opt.id
                  ? `${scenario.color}15`
                  : theme.cardBg,
              border: `2px solid ${
                selected === opt.id
                  ? scenario.color
                  : hoveredOption === opt.id
                  ? `${scenario.color}60`
                  : theme.cardBorder
              }`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: SPACING[3],
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  flexShrink: 0,
                  border: `2px solid ${
                    selected === opt.id ? scenario.color : theme.cardBorder
                  }`,
                  background:
                    selected === opt.id ? scenario.color : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                  marginTop: 2,
                }}
              >
                {selected === opt.id && (
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      background: "#fff",
                    }}
                  />
                )}
              </div>
              <div>
                <div
                  style={{
                    fontSize: FONT_SIZES.base,
                    fontWeight: 700,
                    color: theme.textPrimary,
                    fontFamily: FONT_SERIF,
                    marginBottom: SPACING["0.5"],
                  }}
                >
                  {opt.label}
                </div>
                <div
                  style={{
                    fontSize: FONT_SIZES.sm,
                    color: theme.textSecondary,
                    lineHeight: 1.6,
                    fontFamily: FONT_SERIF,
                  }}
                >
                  {opt.desc}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Confirm */}
      <button
        onClick={() => selected && onChoose(selected)}
        disabled={!selected}
        style={{
          width: "100%",
          padding: `${SPACING[3]} ${SPACING[6]}`,
          borderRadius: RADII.xl,
          border: "none",
          background: selected ? scenario.color : theme.cardBorder,
          color: selected ? "#fff" : theme.textMuted,
          fontSize: FONT_SIZES.base,
          fontFamily: FONT_MONO,
          fontWeight: 700,
          cursor: selected ? "pointer" : "default",
          transition: "all 0.2s",
          letterSpacing: "0.02em",
        }}
      >
        {selected ? "Lock In My Decision" : "Select an option above"}
      </button>
    </div>
  );
}

function RevealScreen({ scenario, playerChoice, onNext, isLast, theme, dark }) {
  const chose = scenario.options.find((o) => o.id === playerChoice);
  const historical = scenario.options.find(
    (o) => o.id === scenario.historicalChoice
  );
  const isCorrect = playerChoice === scenario.historicalChoice;

  return (
    <div>
      {/* Result banner */}
      <div
        style={{
          background: isCorrect
            ? dark
              ? "#05966915"
              : "#D1FAE5"
            : dark
            ? "#F59E0B15"
            : "#FEF3C7",
          border: `2px solid ${isCorrect ? "#05966940" : "#F59E0B40"}`,
          borderRadius: RADII["2xl"],
          padding: `${SPACING[5]} ${SPACING[6]}`,
          marginBottom: SPACING[4],
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 40, marginBottom: SPACING[2] }}>
          {isCorrect ? "\u{1F3AF}" : "\u{1F914}"}
        </div>
        <div
          style={{
            fontSize: FONT_SIZES.lg,
            fontWeight: 700,
            color: theme.textPrimary,
            fontFamily: FONT_SERIF,
            marginBottom: SPACING[1],
          }}
        >
          {getGradeText(isCorrect)}
        </div>
        <div
          style={{
            fontSize: FONT_SIZES.tiny,
            color: theme.textSecondary,
            fontFamily: FONT_MONO,
          }}
        >
          {scenario.flag} {scenario.name} &middot; {scenario.title}
        </div>
      </div>

      {/* What you chose vs what happened */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: SPACING[3],
          marginBottom: SPACING[4],
        }}
      >
        <div
          style={{
            padding: `${SPACING[3]} ${SPACING[4]}`,
            borderRadius: RADII.xl,
            background: theme.subtleBg,
            border: `1.5px solid ${theme.cardBorder}`,
          }}
        >
          <div
            style={{
              fontSize: FONT_SIZES.micro,
              fontWeight: 700,
              color: theme.textSecondary,
              fontFamily: FONT_MONO,
              marginBottom: SPACING["1.5"],
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Your choice
          </div>
          <div
            style={{
              fontSize: FONT_SIZES.base,
              fontWeight: 700,
              color: theme.textPrimary,
              fontFamily: FONT_SERIF,
            }}
          >
            {chose.label}
          </div>
        </div>
        <div
          style={{
            padding: `${SPACING[3]} ${SPACING[4]}`,
            borderRadius: RADII.xl,
            background: isCorrect
              ? dark
                ? "#05966915"
                : "#D1FAE5"
              : dark
              ? "#F59E0B15"
              : "#FEF3C7",
            border: `1.5px solid ${isCorrect ? "#05966940" : "#F59E0B40"}`,
          }}
        >
          <div
            style={{
              fontSize: FONT_SIZES.micro,
              fontWeight: 700,
              color: isCorrect ? "#059669" : "#D97706",
              fontFamily: FONT_MONO,
              marginBottom: SPACING["1.5"],
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            What actually happened
          </div>
          <div
            style={{
              fontSize: FONT_SIZES.base,
              fontWeight: 700,
              color: theme.textPrimary,
              fontFamily: FONT_SERIF,
            }}
          >
            {historical.label}
          </div>
        </div>
      </div>

      {/* Historical reveal */}
      <div
        style={{
          background: theme.cardBg,
          border: `1.5px solid ${theme.cardBorder}`,
          borderRadius: RADII["2xl"],
          padding: `${SPACING[5]} ${SPACING[5]}`,
          marginBottom: SPACING[3],
        }}
      >
        <div
          style={{
            fontSize: FONT_SIZES.micro,
            fontWeight: 700,
            color: scenario.color,
            fontFamily: FONT_MONO,
            marginBottom: SPACING[2],
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          What happened
        </div>
        <p
          style={{
            fontSize: FONT_SIZES.base,
            lineHeight: 1.75,
            color: theme.textDescription,
            margin: 0,
            fontFamily: FONT_SERIF,
          }}
        >
          {scenario.reveal}
        </p>
      </div>

      {/* Why it was rational */}
      <div
        style={{
          background: theme.cardBg,
          border: `1.5px solid ${theme.cardBorder}`,
          borderRadius: RADII["2xl"],
          padding: `${SPACING[5]} ${SPACING[5]}`,
          marginBottom: SPACING[3],
        }}
      >
        <div
          style={{
            fontSize: FONT_SIZES.micro,
            fontWeight: 700,
            color: "#059669",
            fontFamily: FONT_MONO,
            marginBottom: SPACING[2],
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Why it was rational
        </div>
        <p
          style={{
            fontSize: FONT_SIZES.base,
            lineHeight: 1.75,
            color: theme.textDescription,
            margin: 0,
            fontFamily: FONT_SERIF,
          }}
        >
          {scenario.whyRational}
        </p>
      </div>

      {/* Why your choice wouldn't have worked (if different) */}
      {!isCorrect && scenario.whyOthersFailed[playerChoice] && (
        <div
          style={{
            background: dark ? "#F59E0B08" : "#FFFBEB",
            border: `1.5px solid ${dark ? "#F59E0B30" : "#FDE68A"}`,
            borderRadius: RADII["2xl"],
            padding: `${SPACING[5]} ${SPACING[5]}`,
            marginBottom: SPACING[3],
          }}
        >
          <div
            style={{
              fontSize: FONT_SIZES.micro,
              fontWeight: 700,
              color: "#D97706",
              fontFamily: FONT_MONO,
              marginBottom: SPACING[2],
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Why &ldquo;{chose.short}&rdquo; was rejected
          </div>
          <p
            style={{
              fontSize: FONT_SIZES.base,
              lineHeight: 1.75,
              color: theme.textDescription,
              margin: 0,
              fontFamily: FONT_SERIF,
            }}
          >
            {scenario.whyOthersFailed[playerChoice]}
          </p>
        </div>
      )}

      {/* Skill connection */}
      <div
        style={{
          background: dark ? "#7C3AED10" : "#EDE9FE",
          border: `1.5px solid ${dark ? "#7C3AED30" : "#C4B5FD"}`,
          borderRadius: RADII["2xl"],
          padding: `${SPACING[3]} ${SPACING[5]}`,
          marginBottom: SPACING[5],
        }}
      >
        <div
          style={{
            fontSize: FONT_SIZES.micro,
            fontWeight: 700,
            color: "#7C3AED",
            fontFamily: FONT_MONO,
            marginBottom: SPACING[1],
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Skill connection
        </div>
        <p
          style={{
            fontSize: FONT_SIZES.tiny,
            color: dark ? "#C4B5FD" : "#6D28D9",
            lineHeight: 1.6,
            margin: 0,
            fontFamily: FONT_MONO,
          }}
        >
          {scenario.skillConnection}
        </p>
      </div>

      {/* Next button */}
      <button
        onClick={onNext}
        style={{
          width: "100%",
          padding: `${SPACING[3]} ${SPACING[6]}`,
          borderRadius: RADII.xl,
          border: "none",
          background: scenario.color,
          color: "#fff",
          fontSize: FONT_SIZES.base,
          fontFamily: FONT_MONO,
          fontWeight: 700,
          cursor: "pointer",
          letterSpacing: "0.02em",
        }}
      >
        {isLast ? "See My Results \u2192" : "Next Decision \u2192"}
      </button>
    </div>
  );
}

function ResultsScreen({ choices, onRestart, theme, dark }) {
  const correct = choices.filter(
    (c, i) => c === SCENARIOS[i].historicalChoice
  ).length;
  const total = SCENARIOS.length;
  const pct = Math.round((correct / total) * 100);

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 60, marginBottom: SPACING[3] }}>
        {pct >= 80 ? "\u{1F3C6}" : pct >= 50 ? "\u2694\uFE0F" : "\u{1F4DA}"}
      </div>
      <h2
        style={{
          fontSize: FONT_SIZES.xxl,
          fontWeight: 700,
          margin: `0 0 ${SPACING["1.5"]} 0`,
          fontFamily: FONT_SERIF,
          color: theme.textPrimary,
        }}
      >
        {correct} of {total} Historical Decisions
      </h2>
      <p
        style={{
          fontSize: FONT_SIZES.base,
          color: theme.textSecondary,
          margin: `0 0 ${SPACING[6]} 0`,
          fontFamily: FONT_SERIF,
          maxWidth: 500,
          marginLeft: "auto",
          marginRight: "auto",
          lineHeight: 1.6,
        }}
      >
        {pct >= 80
          ? "You think like a 1914 diplomat. You understood the pressures, alliances, and fears that drove each nation\u2019s choices. That\u2019s historical empathy in action."
          : pct >= 50
          ? "You made some different calls than the historical leaders did. The interesting question isn\u2019t whether you were \u2018wrong\u2019 \u2014 it\u2019s why reasonable people in 1914 chose differently than you would have."
          : "You chose very differently from what actually happened \u2014 which means you probably avoided a world war. The tragedy of 1914 is that the \u2018rational\u2019 choices led to catastrophe. Your instincts toward peace were good. The system made peace impossible."}
      </p>

      {/* Decision summary */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: SPACING[2],
          textAlign: "left",
          marginBottom: SPACING[6],
        }}
      >
        {SCENARIOS.map((s, i) => {
          const playerChoice = choices[i];
          const isCorrect = playerChoice === s.historicalChoice;
          const chose = s.options.find((o) => o.id === playerChoice);
          return (
            <div
              key={s.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: SPACING[3],
                padding: `${SPACING[3]} ${SPACING[4]}`,
                borderRadius: RADII.xl,
                background: theme.subtleBg,
                border: `1.5px solid ${theme.cardBorder}`,
              }}
            >
              <span style={{ fontSize: 24 }}>{s.flag}</span>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: FONT_SIZES.sm,
                    fontWeight: 700,
                    color: theme.textPrimary,
                    fontFamily: FONT_SERIF,
                  }}
                >
                  {s.name}: {s.title}
                </div>
                <div
                  style={{
                    fontSize: FONT_SIZES.micro,
                    color: theme.textMuted,
                    fontFamily: FONT_MONO,
                  }}
                >
                  You chose: {chose?.short}
                </div>
              </div>
              <span style={{ fontSize: 20 }}>
                {isCorrect ? "\u{1F3AF}" : "\u{1F914}"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Big takeaway */}
      <div
        style={{
          background: dark ? "#F59E0B10" : "#FEF3C7",
          border: `2px solid ${dark ? "#F59E0B30" : "#FDE68A"}`,
          borderRadius: RADII["2xl"],
          padding: `${SPACING[5]} ${SPACING[6]}`,
          marginBottom: SPACING[6],
          textAlign: "left",
        }}
      >
        <div
          style={{
            fontSize: FONT_SIZES.micro,
            fontWeight: 700,
            color: "#D97706",
            fontFamily: FONT_MONO,
            marginBottom: SPACING[2],
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          The big question
        </div>
        <p
          style={{
            fontSize: FONT_SIZES.md,
            color: theme.textPrimary,
            lineHeight: 1.75,
            margin: 0,
            fontFamily: FONT_SERIF,
            fontStyle: "italic",
          }}
        >
          Every nation made a decision that was rational from their own
          perspective. No single leader woke up wanting a world war. Yet the
          system of alliances, military plans, and national fears meant that each
          &ldquo;rational&rdquo; choice made the next one inevitable. If everyone
          acted reasonably and the result was catastrophe &mdash; was the problem
          the people, or the system?
        </p>
      </div>

      <div style={{ display: "flex", gap: SPACING[3], justifyContent: "center" }}>
        <button
          onClick={onRestart}
          style={{
            padding: `${SPACING[3]} ${SPACING[8]}`,
            background: theme.accentGold,
            color: "#18181B",
            border: "none",
            borderRadius: RADII.xl,
            fontSize: FONT_SIZES.base,
            fontFamily: FONT_MONO,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Play Again
        </button>
      </div>
    </div>
  );
}

// ── Main Game Component ──
export default function WWIDecisions({ event, eventId, onClose }) {
  const { theme, mode } = useTheme();
  const dark = mode === "dark";

  const [phase, setPhase] = useState("intro");
  const [currentScenario, setCurrentScenario] = useState(0);
  const [choices, setChoices] = useState([]);
  const [currentChoice, setCurrentChoice] = useState(null);

  const handleChoose = useCallback((optionId) => {
    setCurrentChoice(optionId);
    setPhase("reveal");
  }, []);

  const handleNext = useCallback(() => {
    const newChoices = [...choices, currentChoice];
    setChoices(newChoices);
    setCurrentChoice(null);

    if (currentScenario >= SCENARIOS.length - 1) {
      setPhase("results");
    } else {
      setCurrentScenario((s) => s + 1);
      setPhase("briefing");
    }
  }, [choices, currentChoice, currentScenario]);

  const handleRestart = useCallback(() => {
    setPhase("intro");
    setCurrentScenario(0);
    setChoices([]);
    setCurrentChoice(null);
  }, []);

  const scenario = SCENARIOS[currentScenario];

  return (
    <div style={{ fontFamily: FONT_SERIF, color: theme.textPrimary }}>
      {/* Header */}
      <div
        style={{
          background: "#18181B",
          color: "#fff",
          padding: `${SPACING[4]} ${SPACING[6]}`,
          borderRadius: `${RADII["2xl"]} ${RADII["2xl"]} 0 0`,
        }}
      >
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: SPACING[2],
              marginBottom: SPACING["0.5"],
            }}
          >
            <span
              style={{
                fontSize: FONT_SIZES.micro,
                fontWeight: 700,
                color: theme.accentGold,
                fontFamily: FONT_MONO,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                background: `${theme.accentGold}18`,
                padding: `${SPACING["0.5"]} ${SPACING[2]}`,
                borderRadius: RADII.sm,
              }}
            >
              Historian&rsquo;s Workshop
            </span>
          </div>
          <h1
            style={{
              fontSize: FONT_SIZES.lg,
              fontWeight: 700,
              margin: `${SPACING[1]} 0 0`,
              letterSpacing: "-0.01em",
              fontFamily: FONT_SERIF,
            }}
          >
            The Rational Road to Catastrophe
          </h1>
        </div>
      </div>

      {/* Progress bar */}
      {phase !== "intro" && phase !== "results" && (
        <div
          style={{
            background: "#18181B",
            padding: `0 ${SPACING[6]} ${SPACING[3]}`,
            borderRadius: `0 0 ${RADII["2xl"]} ${RADII["2xl"]}`,
          }}
        >
          <div style={{ maxWidth: 680, margin: "0 auto" }}>
            <div style={{ display: "flex", gap: SPACING[1] }}>
              {SCENARIOS.map((s, i) => (
                <div
                  key={s.id}
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 2,
                    background:
                      i < currentScenario
                        ? s.color
                        : i === currentScenario
                        ? `${s.color}80`
                        : "#3F3F46",
                    transition: "all 0.3s",
                  }}
                />
              ))}
            </div>
            <div
              style={{
                fontSize: FONT_SIZES.micro,
                color: "#6B7280",
                fontFamily: FONT_MONO,
                marginTop: SPACING["1.5"],
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>
                Decision {currentScenario + 1} of {SCENARIOS.length}
              </span>
              <span>
                {scenario.flag} {scenario.name}
              </span>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          maxWidth: 680,
          margin: "0 auto",
          padding: `${SPACING[6]} ${SPACING[6]} ${SPACING[10]}`,
        }}
      >
        {/* Intro */}
        {phase === "intro" && (
          <div style={{ textAlign: "center", padding: `${SPACING[10]} 0` }}>
            <div style={{ fontSize: 60, marginBottom: SPACING[4] }}>
              {"\u2694\uFE0F"}
            </div>
            <h2
              style={{
                fontSize: FONT_SIZES.xxl,
                fontWeight: 700,
                margin: `0 0 ${SPACING[3]} 0`,
                fontFamily: FONT_SERIF,
              }}
            >
              The Rational Road to Catastrophe
            </h2>
            <p
              style={{
                fontSize: FONT_SIZES.md,
                color: theme.textSecondary,
                maxWidth: 500,
                margin: `0 auto ${SPACING[2]}`,
                lineHeight: 1.75,
                fontFamily: FONT_SERIF,
              }}
            >
              In the summer of 1914, six nations made decisions that dragged all
              of Europe into the deadliest war the world had ever seen. None of
              them wanted a world war. Every single one made a choice that seemed
              rational at the time.
            </p>
            <p
              style={{
                fontSize: FONT_SIZES.base,
                color: theme.textMuted,
                maxWidth: 500,
                margin: `0 auto ${SPACING[8]}`,
                lineHeight: 1.7,
                fontFamily: FONT_MONO,
              }}
            >
              You&rsquo;ll face each nation&rsquo;s decision. Choose what
              you&rsquo;d do &mdash; then find out what actually happened, and
              why.
            </p>
            <button
              onClick={() => {
                setPhase("briefing");
                setCurrentScenario(0);
                setChoices([]);
              }}
              style={{
                padding: `${SPACING[4]} 36px`,
                background: theme.accentGold,
                color: "#18181B",
                border: "none",
                borderRadius: RADII.xl,
                fontSize: FONT_SIZES.md,
                fontFamily: FONT_MONO,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Begin &rarr;
            </button>
          </div>
        )}

        {/* Briefing */}
        {phase === "briefing" && (
          <BriefingScreen
            scenario={scenario}
            onChoose={handleChoose}
            theme={theme}
            dark={dark}
          />
        )}

        {/* Reveal */}
        {phase === "reveal" && (
          <RevealScreen
            scenario={scenario}
            playerChoice={currentChoice}
            onNext={handleNext}
            isLast={currentScenario >= SCENARIOS.length - 1}
            theme={theme}
            dark={dark}
          />
        )}

        {/* Results */}
        {phase === "results" && (
          <ResultsScreen
            choices={choices}
            onRestart={handleRestart}
            theme={theme}
            dark={dark}
          />
        )}
      </div>
    </div>
  );
}
