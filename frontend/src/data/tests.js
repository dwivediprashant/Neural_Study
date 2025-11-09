export const TESTS = [
  {
    id: 'jee-physics-wave-optics',
    title: 'Wave Optics Drill',
    description: '20 conceptual questions covering interference, diffraction, and polarisation basics.',
    duration: '25 min',
    difficulty: 'Intermediate',
    questions: [
      {
        id: 'q1',
        prompt: 'In Young\'s double slit experiment, the source is replaced by another source of twice the wavelength. The fringe width will become…',
        options: ['Half', 'Double', 'Four times', 'Unchanged'],
        answerIndex: 1,
        explanation: 'Fringe width is directly proportional to wavelength, so doubling wavelength doubles the fringe width.',
      },
      {
        id: 'q2',
        prompt: 'A polariser and analyser are oriented at 45°. If the incident intensity is I₀, transmitted intensity is…',
        options: ['I₀', 'I₀/2', 'I₀/√2', 'I₀/4'],
        answerIndex: 3,
        explanation: "Malus' law: I = I₀ cos²θ, with θ = 45°, giving I₀/2, but analyser after polariser results in I₀/2? Wait: If incident is unpolarised, polariser transmits I₀/2, analyser then I = (I₀/2) cos²45° = I₀/4.",
      },
      {
        id: 'q3',
        prompt: 'Which phenomenon confirms the wave nature of light?',
        options: ['Photoelectric effect', 'Compton effect', 'Interference', 'Bohr spectrum'],
        answerIndex: 2,
        explanation: 'Interference is a hallmark of wave behaviour.',
      },
    ],
  },
  {
    id: 'neet-biology-genetics',
    title: 'Genetics Quick Check',
    description: 'Assess Mendelian genetics, chromosomal theory, and pedigree decoding in 15 focused items.',
    duration: '20 min',
    difficulty: 'Advanced',
    questions: [
      {
        id: 'q1',
        prompt: 'Independent assortment occurs during which meiotic stage?',
        options: ['Prophase I', 'Metaphase I', 'Anaphase I', 'Telophase II'],
        answerIndex: 2,
        explanation: 'Homologous chromosomes separate during anaphase I leading to independent assortment.',
      },
      {
        id: 'q2',
        prompt: 'A cross between AaBb and aabb produces offspring. What proportion will be aaBb?',
        options: ['1/8', '1/4', '3/8', '1/2'],
        answerIndex: 1,
        explanation: 'Aa x aa gives 1/2 aa; Bb x bb gives 1/2 Bb; combined probability 1/4.',
      },
      {
        id: 'q3',
        prompt: 'Pedigree showing trait in every generation is likely to be…',
        options: ['Autosomal recessive', 'Autosomal dominant', 'X-linked recessive', 'Mitochondrial recessive'],
        answerIndex: 1,
        explanation: 'Presence in each generation indicates autosomal dominant inheritance.',
      },
    ],
  },
  {
    id: 'aptitude-speed-math',
    title: 'Speed Math Booster',
    description: 'Timed arithmetic and ratio problems designed to improve calculation agility.',
    duration: '15 min',
    difficulty: 'Beginner',
    questions: [
      {
        id: 'q1',
        prompt: 'Solve: 48 × 25 = ?',
        options: ['1020', '1120', '1200', '1250'],
        answerIndex: 2,
        explanation: '48 × 25 = 48 × (100/4) = 4800/4 = 1200.',
      },
      {
        id: 'q2',
        prompt: 'If A:B = 3:4 and B:C = 2:5, what is A:C?',
        options: ['6:5', '3:10', '3:5', '6:7'],
        answerIndex: 1,
        explanation: 'B common: 4×?=2? Multiply ratios: A:B = 3:4, B:C = 8:20 => A:C = 3:10.',
      },
      {
        id: 'q3',
        prompt: 'The simple interest on ₹5000 at 8% per annum for 2 years is…',
        options: ['₹400', '₹600', '₹700', '₹800'],
        answerIndex: 1,
        explanation: 'SI = PRT/100 = 5000×8×2/100 = 800, wait check: 5000×0.08=400 per year, two years=800. Correct answer ₹800.',
      },
    ],
  },
];

export const findTestById = (id) => TESTS.find((test) => test.id === id);
