export interface Article {
  slug: string;
  title: string;
  description: string;
  category: string;
  readingTime: string;
}

export const ARTICLES: Article[] = [
  {
    slug: 'what-is-anxiety',
    title: '不安って何だろう',
    description:
      '不安は「壊れた」のではなく、体の自然な反応。でも、しんどいのは確かです。',
    category: 'きほん',
    readingTime: '5分',
  },
  {
    slug: 'adjustment-disorder',
    title: '適応障害と「環境を変える」権利',
    description:
      '自分が弱いから、ではない。環境と自分の間に起きていること。',
    category: 'きほん',
    readingTime: '6分',
  },
  {
    slug: 'bipolar-long-journey',
    title: '双極性障害との長い付き合い方',
    description: '波があることを前提に、自分なりのリズムを見つける。',
    category: 'きほん',
    readingTime: '7分',
  },
  {
    slug: 'cognitive-distortions',
    title: '認知の歪みカタログ',
    description:
      '思考のクセに気づくだけで、少し楽になることがあります。',
    category: 'CBT',
    readingTime: '5分',
  },
  {
    slug: 'about-medication',
    title: '薬を飲むことについて',
    description: '飲むことも、迷うことも、どちらも自然です。',
    category: 'くらし',
    readingTime: '5分',
  },
];

export function getArticleBySlug(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}
