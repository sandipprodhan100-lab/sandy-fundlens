import { useEffect, useState } from "react";
import { ArrowUpRight, Plane, Sparkles } from "lucide-react";
import { STORIES } from "@/generated/stories";

const POSTS = [
  {
    id: "london",
    tag: "Rishi Blogpost",
    title: "My London Journey",
    date: "A London notebook",
    image:
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=85",
    body: "London felt like a storybook that someone had left open. I saw red buses, old buildings, the River Thames and so many people going somewhere interesting. My favourite part was looking up and noticing that every street seemed to have a different shape.",
    note: "I want to come back when I am older and visit more museums, parks and football grounds.",
  },
  {
    id: "airports",
    tag: "Rishi Research",
    title: "Airports Around the World",
    date: "A first research note",
    image:
      "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=85",
    body: "Airports are like small cities where journeys begin. Some are famous for being enormous, some for their beautiful buildings, and some for helping people reach places that would otherwise feel very far away.",
    note: "My question: which airport has the best design, the busiest runways and the most surprising destination?",
  },
];

const THE_COORDINATE_OF_AUTUMN = {
  title: "The Coordinate of Autumn",
  author: "Sapatarshi Dasprodhan",
  image:
    "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1400&q=85",
  imageAlt: "Autumn coastline beneath a grey sky",
  detailImage:
    "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1000&q=85",
  detailImageAlt: "Rain falling across a window",
  galleryImage:
    "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=90",
  galleryImageAlt: "Golden autumn trees beside a quiet path",
  body: `The rain over Oakhaven smelled of salt and old zinc. Arthur Finch liked the smell; it kept the world sharp at the edges, which mattered when your living depended on screws smaller than a grain of mustard seed.

His shop sat on the elbow of Harbor Lane, wedged between a cooperage that had ceased coopering forty years ago and a tea merchant whose bins held only dust. In the window, suspended by fine brass wires, hung six dozen pendulums. None of them swung in time with any other. Arthur did not believe in forcing clocks to agree; agreement was a human vanity, whereas time was an unruly harbor full of separate tides.

At a quarter past four, the brass bell above the door gave a tired clink.

A woman stood on the threshold, shaking water from the brim of a dark green felt hat. She carried a rectangular wooden box tucked under her elbow like a ledger. She was young—not more than twenty-five—with the restless posture of someone who had spent the last three hours deciding whether to knock.

“Mr. Finch?” she asked.

“Unless the sign outside fell down,” Arthur said, not looking up from his magnifier. He was easing the balance wheel back into a carriage clock that had developed a nervous tremor.

The woman stepped inside, letting the door latch behind her. She set the box on the counter. The wood was walnut, darkened with age and scarred by a ring where a hot cup had once rested.

“My grandfather died in November,” she said. “In the attic, behind the water cistern, we found this. The local jeweller in Redruth told me to throw it out. Said the harbor was sheared and the mainspring had crystallized. Then he told me if I was stubborn enough, there was a man near the docks who lived on tea and spite who might look at it anyway.”

Arthur adjusted his eyepiece and peered over the brass rim of his spectacles. “Hensley said that, did he? Hensley uses machine grease on verge escapements. The man is a butcher in an apron.”

He pulled the box toward him. The brass clasp was seized with green verdigris, but the wood gave way under his thumb with a hollow, resinous pop.

Inside, nestled in shredded velvet that had faded from crimson to the color of dried brick, lay a pocket watch the size of an apple. Its casing was silver-nickel, thick and heavy, but the backplate was engraved not with flowers or crests, but with concentric geometric rings, like the cross-section of a nautilus shell.

Arthur touched the crown. It didn’t turn; it slid sideways, clicking into an invisible notch.

“His name was Donald Vance,” the woman offered softly. “My name is Clara.”

“Donald was an engineer at the dry docks,” Arthur murmured, turning the piece under the green shade of his lamp. “He worked on steam turbines. Always had graphite under his fingernails and smelled like boiler scale. I haven’t seen him since the winter the harbor froze.”

“He never spoke of clocks,” Clara said. “Only boilers and pressure gauges. But inside this… listen.”

She leaned in. Arthur did not need to be told. He picked up his wooden-handled diagnostic rod, pressed the ball end to the watch case, and held the flat end against the bone behind his ear.

The watch was not ticking. It was sighing.

A rhythmic, dry friction—two discs of slate or mica brushing past one another in a slow, elliptical loop. Every six seconds, a faint, metallic ping resonated through the nickel shell, followed by the muffled drag of a counterweight.

Arthur’s hands, usually as steady as bench vises, felt a prickle of genuine heat. “This isn’t a watch, Miss Vance. The dial has no numbers.”

He reached for a curved case-knife and wedged the blade into the hairline seam along the rim. With a dry snap, the bezel lifted.

The face was polished slate. In place of hands, three tiny brass needles with ivory beads on their tips traced independent, grooved tracks across the dark stone. They did not rotate around a centre pin. They wandered—spiralling inward, pausing, then retreating along eccentric curves.

“What is it measuring?” Clara whispered.

Arthur didn’t answer immediately. He took a pair of long-nosed tweezers and lifted the movement from its bed. The reverse side was an interlocking labyrinth of cam-wheels, each tooth hand-cut with uneven, stubborn strokes. Donald Vance had not built this with high-precision Swiss lathes; he had cut it with needle files, oilstones, and sheer, solitary patience over decades.

Attached to the escapement was a tiny cylinder of hammered tin, perforated like a music box drum, but wrapped in a thin layer of gold leaf.

“It isn’t measuring time,” Arthur said, setting the mechanism gently on a disc of deer hide. “It’s a record.”

“A record of what?”

“A tide.” Arthur pointed the tip of his tweezers at a spiral spring coiled inside the barrel. “Look at the tensioning. It doesn’t use an anchor recoil. It’s calibrated to barometric drag and gravitational swing. Your grandfather built an instrument to map a specific cycle. Something that happened once, or something he was waiting to happen again.”

Clara sat down on the stool beside the counter, her wet coat forgotten. “When he was an old man, he would sit on the seawall at the mouth of the bay. Every evening at seven. Even when the gales blew the spray over the parapet. My mother thought he was losing his mind.”

“He wasn’t,” Arthur said. He reached into his drawer for a bottle of distilled naphtha and a sable-hair brush. “Donald was the most stubborn man in Cornwall. If he sat on the wall, he had a calculation to prove the wall was the only place worth sitting.”

Arthur touched the brush to a frozen pivot. A bead of ancient, gummy whale oil dissolved, releasing the tiny steel arbor.

The mechanism gave a shudder.

The central needle hopped forward. The tin cylinder turned one fraction of a millimetre, and from within the guts of the clockwork, a chime sounded—not the clean, bright ring of a bell, but a muted, hollow chord, like two harbor buoys striking together in a swell.

The three beads moved. They aligned in a perfect triangle across the black slate, held their positions for three slow breaths, and then, with a soft click, settled into a groove at the slate’s bottom edge.

On the rim beneath that final groove, scratched with the tip of an awl so lightly it could only be seen under the direct glare of the workbench lamp, was a single date and a latitude.

14 October. Low water.

Arthur looked up. “Did your grandmother pass in the autumn?”

“No,” Clara said, her voice dropping. “Grandmother died when my mother was an infant. But he met someone later. During the war. A wireless operator stationed at the headland. She was transferred out on a convoy ship in October of forty-four. He never spoke her name, but my mother found a bundle of maritime charts in his sea chest with the coordinates of the lightship off the reef.”

The shop fell quiet except for the rain tapping on the zinc roof and the sixty disparate pendulums whispering on the wall.

Arthur set the casing back over the gears, though he did not press the seal tight. Some mechanisms were meant to remain open to the weather they were built for.

“He didn’t make this to tell him what time it was,” Arthur said, sliding the box back across the scarred counter to Clara. “He made it so he wouldn’t forget how long the tide takes to go out, and exactly where to look when it turns.”

Clara placed her palm over the wood. “Can it be wound again?”

“No,” Arthur replied, his voice unexpectedly gentle. “It finished what it was doing. Leave it be. Put it on a shelf where it can catch the morning light.”

She picked up the box, nodded once with her eyes bright, and stepped out into the rainy street. Arthur watched through the glass as her green hat vanished into the mist toward the quay.

Then he picked up his magnifier, retrieved his tweezers, and went back to the carriage clock, letting the harbor take its time.`,
};

function RishiMark() {
  return (
    <a href="#top" className="flex items-center gap-2.5">
      <span className="grid size-10 place-items-center rounded-2xl bg-[#ef6c3b] text-white shadow-[0_8px_24px_rgba(239,108,59,0.22)]">
        <Sparkles className="size-5" strokeWidth={2.2} />
      </span>
      <span className="font-[Georgia] text-xl font-bold tracking-[-0.03em] text-[#163b45]">
        Rishi <span className="text-[#ef6c3b]">notes</span>
      </span>
    </a>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#ef6c3b]">{children}</p>;
}

export function RishiLandingPage() {
  const [dreams, setDreams] = useState("");

  useEffect(() => {
    setDreams(window.localStorage.getItem("rishi-dreams") ?? "");
  }, []);

  function updateDreams(value: string) {
    setDreams(value);
    window.localStorage.setItem("rishi-dreams", value);
  }

  return (
    <div id="top" className="min-h-screen overflow-hidden bg-[#fffaf3] text-[#163b45]">
      <header className="sticky top-0 z-30 border-b border-[#e8ded1]/80 bg-[#fffaf3]/90 px-5 py-4 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-5">
          <RishiMark />
          <nav className="hidden items-center gap-7 text-sm font-semibold text-[#52717a] md:flex">
            <a href="#blog">Blogpost</a>
            <a href="#research">Research</a>
            <a href="#fundlens">RishiMFLens</a>
          </nav>
          <a href="https://fundlens.rishi10ai.com" className="inline-flex items-center gap-1.5 rounded-full bg-[#163b45] px-4 py-2 text-sm font-bold text-white transition-transform hover:-translate-y-0.5">
            Open Fund Lens <ArrowUpRight className="size-4" />
          </a>
        </div>
      </header>

      <main>
        <section className="relative px-5 pb-20 pt-16 sm:px-8 sm:pt-24">
          <div className="pointer-events-none absolute -right-28 top-6 size-80 rounded-full bg-[#f7c96d]/30 blur-3xl" />
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#e8ded1] bg-white/70 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#52717a]">
                <span className="size-2 rounded-full bg-[#79b95c]" /> A curious corner of the internet
              </p>
              <h1 className="max-w-3xl font-[Georgia] text-5xl font-bold leading-[0.98] tracking-[-0.055em] text-[#163b45] sm:text-7xl">
                Big questions. <span className="text-[#ef6c3b]">Small notebook.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-[#52717a] sm:text-xl">
                I am Rishi. This is where I write about places I visit, things I research and dreams I am still learning how to build.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#blog" className="rounded-full bg-[#ef6c3b] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(239,108,59,0.2)]">Read the posts</a>
                <a href="#dreams" className="rounded-full border border-[#d8cabc] bg-white px-5 py-3 text-sm font-bold text-[#163b45]">See my dreams</a>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-md rotate-2 rounded-[2rem] border-[10px] border-white bg-[#d9eef0] p-3 shadow-[0_24px_70px_rgba(22,59,69,0.14)]">
              <div className="aspect-[4/5] overflow-hidden rounded-[1.35rem] bg-[#a9d4d6]">
                <img src="/rishi/notebook.jpg" alt="Rishi and friends looking out across a mountain lake" className="h-full w-full object-cover" />
              </div>
              <span className="absolute -bottom-4 -left-5 rotate-[-8deg] rounded-xl bg-[#f7c96d] px-4 py-2 font-[Georgia] text-sm font-bold text-[#163b45] shadow-md">keep wondering</span>
            </div>
          </div>
        </section>

        <section id="blog" className="border-y border-[#e8ded1] bg-white px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-6xl">
            <SectionLabel>01 / Rishi Blogpost</SectionLabel>
            <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
              <h2 className="max-w-2xl font-[Georgia] text-4xl font-bold leading-tight tracking-[-0.04em] sm:text-5xl">Stories from the road, told in my own words.</h2>
              <p className="max-w-xs text-sm leading-6 text-[#52717a]">A ten-year-old view of places that feel much bigger than a map.</p>
            </div>
            <article className="grid overflow-hidden rounded-[1.5rem] border border-[#e8ded1] bg-[#fffaf3] lg:grid-cols-[0.9fr_1.1fr]">
              <img src={POSTS[0].image} alt="London skyline and the River Thames" className="h-full min-h-72 w-full object-cover" />
              <div className="p-7 sm:p-10">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ef6c3b]">{POSTS[0].date}</p>
                <h3 className="mt-3 font-[Georgia] text-3xl font-bold tracking-[-0.035em]">{POSTS[0].title}</h3>
                <p className="mt-5 text-base leading-8 text-[#52717a]">{POSTS[0].body}</p>
                <p className="mt-5 border-l-2 border-[#f7c96d] pl-4 font-[Georgia] text-lg italic leading-7 text-[#163b45]">{POSTS[0].note}</p>
              </div>
            </article>

            {STORIES.map((story) => (
              <article key={story.slug} className="mt-12 overflow-hidden rounded-[1.5rem] border border-[#e8ded1] bg-[#fffaf3]">
              <div className="px-7 pb-7 pt-8 text-left sm:px-12 sm:pb-9 sm:pt-10">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ef6c3b]">
                  {story.slug === "the-refrigerator-hates-me" ? "Poetry" : "Story"}
                </p>
                <h3 className="mt-3 max-w-3xl font-[Georgia] text-3xl font-bold tracking-[-0.035em] sm:text-4xl">{story.title}</h3>
                <p className="mt-2 text-sm font-semibold text-[#52717a]">Written by {story.author}</p>
              </div>
              {story.slug === "the-refrigerator-hates-me" ? (
                <div className="grid gap-8 px-2 pb-2 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
                  <div className="grid gap-3">
                    {story.images.slice(0, 3).map((image, index) => (
                      <img
                        key={image}
                        src={image}
                        alt={`${story.title} illustration ${index + 1}`}
                        className="h-56 w-full object-cover sm:h-64 lg:h-72"
                      />
                    ))}
                  </div>
                  <div className="max-w-3xl px-5 py-2 sm:px-10 sm:py-4 lg:px-8">
                    <p className="whitespace-pre-line font-[Georgia] text-[1.05rem] leading-8 text-[#52717a]">{story.body}</p>
                  </div>
                </div>
              ) : (
                <div className="mx-auto max-w-3xl px-7 pb-10 sm:px-12">
                  {story.body.split(/\n\n+/).map((paragraph, index) => (
                    <div key={`${story.slug}-${index}`}>
                      <p className="font-[Georgia] text-[1.05rem] leading-8 text-[#52717a]">{paragraph}</p>
                      {story.images[index] && index < story.body.split(/\n\n+/).length - 1 && (
                        <img
                          src={story.images[index]}
                          alt={`${story.title} detail ${index + 1}`}
                          className="my-8 h-64 w-full object-cover sm:h-80"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
              </article>
            ))}
          </div>
        </section>

        <section id="research" className="bg-[#163b45] px-5 py-20 text-white sm:px-8">
          <div className="mx-auto max-w-6xl">
            <SectionLabel>02 / Rishi Research</SectionLabel>
            <div className="grid items-end gap-8 lg:grid-cols-[1fr_0.7fr]">
              <h2 className="max-w-3xl font-[Georgia] text-4xl font-bold leading-tight tracking-[-0.04em] sm:text-5xl">Airports are not just places to wait. They are maps of how the world moves.</h2>
              <p className="text-base leading-7 text-[#c5d9d8]">A research shelf for questions, sketches, facts and observations about airports around the world.</p>
            </div>
            <article className="mt-10 grid overflow-hidden rounded-[1.5rem] bg-[#214e58] lg:grid-cols-[1.1fr_0.9fr]">
              <div className="p-7 sm:p-10">
                <div className="flex items-center gap-3 text-sm font-bold text-[#f7c96d]"><Plane className="size-5" /> Field note 001</div>
                <h3 className="mt-5 font-[Georgia] text-3xl font-bold">{POSTS[1].title}</h3>
                <p className="mt-5 text-base leading-8 text-[#c5d9d8]">{POSTS[1].body}</p>
                <p className="mt-5 border-l-2 border-[#ef6c3b] pl-4 font-[Georgia] text-lg italic leading-7 text-white">{POSTS[1].note}</p>
              </div>
              <img src={POSTS[1].image} alt="Airplane wing above clouds" className="min-h-72 w-full object-cover" />
            </article>
          </div>
        </section>

        <section id="dreams" className="px-5 py-20 sm:px-8">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <SectionLabel>03 / Dreams</SectionLabel>
              <h2 className="font-[Georgia] text-4xl font-bold leading-tight tracking-[-0.04em] sm:text-5xl">A page I am still filling in.</h2>
              <p className="mt-5 max-w-md text-base leading-7 text-[#52717a]">This space is for Rishi to add the places he wants to see, the questions he wants to answer and the things he wants to make.</p>
            </div>
            <div className="rounded-[1.5rem] border border-dashed border-[#d8cabc] bg-white p-6 shadow-[0_16px_44px_rgba(22,59,69,0.06)] sm:p-8">
              <label htmlFor="dreams" className="font-[Georgia] text-2xl font-bold text-[#163b45]">My dreams, in progress</label>
              <textarea id="dreams" value={dreams} onChange={(event) => updateDreams(event.target.value)} placeholder="I want to...\n\nI wonder if...\n\nOne day I will..." className="mt-5 min-h-52 w-full resize-y rounded-xl border border-[#e8ded1] bg-[#fffaf3] p-4 font-[Georgia] text-lg leading-8 text-[#163b45] outline-none placeholder:text-[#9aaeb0] focus:border-[#ef6c3b]" />
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#8b9da0]">Saved in this browser for now · ready for Rishi to make it his own</p>
            </div>
          </div>
        </section>

        <section id="fundlens" className="border-t border-[#e8ded1] bg-[#f7c96d] px-5 py-14 sm:px-8">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#7b5720]">A project by Rishi</p>
              <h2 className="mt-2 font-[Georgia] text-3xl font-bold tracking-[-0.04em] text-[#163b45]">RishiMFLens</h2>
              <p className="mt-2 max-w-xl text-[#5e542f]">A quiet research tool for seeing which mutual funds hold up when markets go sideways.</p>
            </div>
            <a href="https://fundlens.rishi10ai.com" className="inline-flex items-center gap-2 rounded-full bg-[#163b45] px-5 py-3 text-sm font-bold text-white">Explore Fund Lens <ArrowUpRight className="size-4" /></a>
          </div>
        </section>
      </main>

      <footer className="bg-[#fffaf3] px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-sm text-[#52717a]">
          <RishiMark />
          <p>Made with questions, maps and a growing notebook.</p>
        </div>
      </footer>
    </div>
  );
}

export function HostLandingPage({ fundLens }: { fundLens: React.ReactNode }) {
  const [isFundLens, setIsFundLens] = useState(false);

  useEffect(() => {
    setIsFundLens(window.location.hostname === "fundlens.rishi10ai.com");
  }, []);

  return isFundLens ? fundLens : <RishiLandingPage />;
}
