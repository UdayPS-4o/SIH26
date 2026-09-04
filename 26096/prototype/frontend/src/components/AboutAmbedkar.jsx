import portrait from '../assets/portrait-ambedkar.png';

const QUICK = [
  { dt: 'Born', dd: '14 April 1891, Mhow, Central Provinces' },
  { dt: 'Died', dd: '6 December 1956, New Delhi (aged 65)' },
  { dt: 'Education', dd: 'Ph.D. Columbia · D.Sc. LSE · Barrister, Gray’s Inn' },
  { dt: 'Office', dd: 'First Law Minister of India, 1947–1951' },
  { dt: 'Role', dd: 'Chairman, Drafting Committee of the Constitution' },
  { dt: 'Honour', dd: 'Bharat Ratna (posthumous), 1990' },
];

const PILLARS = [
  { h: 'Liberty', p: 'Freedom of thought, expression and belief as the precondition for a dignified life.' },
  { h: 'Equality', p: 'Equal standing before the law and in society, without the graded inequality of caste.' },
  { h: 'Fraternity', p: 'A shared sense of common life &mdash; what he called the true meaning of democracy.' },
  { h: 'Constitutional Morality', p: 'Pursuing change through constitutional means rather than agitation once democracy exists.' },
];

export default function AboutAmbedkar() {
  return (
    <>
      <div className="page-header">
        <div className="page-eyebrow">Life &amp; Legacy</div>
        <h1 className="page-title">About Dr. B. R. Ambedkar</h1>
        <p className="page-subtitle">
          Jurist, economist, social reformer and the principal architect of the Constitution of
          India.
        </p>
      </div>

      <div className="bio-hero">
        <img className="bio-portrait" src={portrait} alt="Portrait of Dr. B. R. Ambedkar holding the Constitution of India" />
        <div>
          <p className="bio-lead">
            Bhimrao Ramji Ambedkar rose from a childhood marked by untouchability to become one of
            the most educated Indians of his generation and the chief draftsman of independent
            India&rsquo;s Constitution. Across four decades he built schools and newspapers, led mass
            movements for the right to water and temple entry, testified before every major
            constitutional commission, and finally guided the Constituent Assembly through nearly
            three years of debate.
          </p>
          <dl className="bio-quick">
            {QUICK.map((q) => (
              <div key={q.dt}>
                <dt>{q.dt}</dt>
                <dd>{q.dd}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="prose">
        <section>
          <h2>Early life and education</h2>
          <p>
            Ambedkar was born in 1891 in the military cantonment town of Mhow, the fourteenth child
            of Ramji Maloji Sakpal, a subedar in the British Indian Army. His family belonged to the
            Mahar community, treated as untouchable. Even as a school pupil in Satara and at
            Elphinstone High School in Bombay he was made to sit apart and denied water by his own
            teachers.
          </p>
          <p>
            A scholarship from the Maharaja of Baroda took him to Columbia University in 1913, where
            he studied economics, sociology and philosophy and completed a master&rsquo;s degree and
            later a Ph.D. He went on to the London School of Economics and Gray&rsquo;s Inn,
            returning to India in 1923 with a D.Sc. in economics and a call to the Bar &mdash; an
            almost unimaginable achievement for someone of his background.
          </p>
        </section>

        <section>
          <h2>Movements for dignity</h2>
          <p>
            Back in India, Ambedkar turned his training on the caste order itself. In 1927 he led
            thousands to drink from the public Chavdar Tank at Mahad, and publicly burned a copy of
            the Manusmriti. He founded newspapers such as <em>Mooknayak</em> and <em>Bahishkrit
            Bharat</em>, organised the Kalaram Temple entry movement in Nashik, and built
            institutions for education and political organisation among the Depressed Classes.
          </p>
          <p>
            At the Round Table Conferences in London he argued that self-government could not be a
            transfer of power from British rulers to a domestic upper-caste elite. The 1932 Poona
            Pact with Gandhi replaced separate electorates with reserved seats &mdash; a compromise
            he accepted under pressure and continued to debate for the rest of his life.
          </p>
        </section>

        <section>
          <h2>Architect of the Constitution</h2>
          <p>
            Elected to the Constituent Assembly in 1946, Ambedkar was appointed Chairman of the
            Drafting Committee and India&rsquo;s first Law Minister. Over two years, eleven months
            and seventeen days he shepherded the drafting of fundamental rights, directive
            principles, an independent judiciary, and safeguards for minorities and Scheduled Castes
            and Tribes. He resigned from the Cabinet in 1951 over the dilution of the Hindu Code
            Bill, which sought to reform Hindu personal law on marriage, divorce and inheritance.
          </p>
        </section>

        <section>
          <h2>The turn to Buddhism</h2>
          <p>
            Having declared in 1935 that though he was born a Hindu he would not die one, Ambedkar
            spent two decades studying the Buddha&rsquo;s teaching. On 14 October 1956 at
            Deekshabhoomi in Nagpur he embraced Buddhism together with an estimated four hundred
            thousand followers, framing the Dhamma as a rational ethics of liberty, equality and
            fraternity. He died seven weeks later, on 6 December 1956.
          </p>
        </section>

        <section>
          <h2>Guiding ideas</h2>
          <div className="pillars">
            {PILLARS.map((p) => (
              <div className="pillar" key={p.h}>
                <h3>{p.h}</h3>
                <p dangerouslySetInnerHTML={{ __html: p.p }} />
              </div>
            ))}
          </div>
        </section>
      </div>

      <footer className="footer">
        <p>
          <span className="accent">Samdarshi</span> &bull; Digital Heritage Archive of Dr. B. R.
          Ambedkar
        </p>
        <p style={{ fontSize: '12px' }}>
          Dr. B. R. Ambedkar was posthumously awarded the <span className="accent">Bharat Ratna</span>{' '}
          in 1990.
        </p>
      </footer>
    </>
  );
}
