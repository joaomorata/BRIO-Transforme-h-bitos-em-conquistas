export interface StudyQuestion {
  subjectId: number;
  question: string;
  correct: string;
  incorrect: string[];
}

export const STUDY_QUESTIONS: StudyQuestion[] = [
  // Ciências
  {
    subjectId: 17,
    question: "Qual é o processo pelo qual as plantas produzem seu próprio alimento?",
    correct: "Fotossíntese",
    incorrect: ["Respiração celular", "Digestão", "Fermentação"],
  },
  {
    subjectId: 17,
    question: "Qual é o estado físico da água quando ela vira gelo?",
    correct: "Sólido",
    incorrect: ["Líquido", "Gasoso", "Plasma"],
  },
  {
    subjectId: 17,
    question: "Qual planeta é conhecido como Planeta Vermelho?",
    correct: "Marte",
    incorrect: ["Vênus", "Júpiter", "Mercúrio"],
  },
  {
    subjectId: 17,
    question: "Qual órgão do corpo humano bombeia o sangue?",
    correct: "Coração",
    incorrect: ["Pulmão", "Fígado", "Estômago"],
  },
  // História
  {
    subjectId: 23,
    question: "Em que ano foi proclamada a Independência do Brasil?",
    correct: "1822",
    incorrect: ["1500", "1889", "1922"],
  },
  {
    subjectId: 23,
    question: "Quem proclamou a Independência do Brasil?",
    correct: "Dom Pedro I",
    incorrect: ["Tiradentes", "Dom Pedro II", "Getúlio Vargas"],
  },
  {
    subjectId: 23,
    question: "Qual civilização construiu as pirâmides de Gizé?",
    correct: "Egípcia",
    incorrect: ["Romana", "Inca", "Grega"],
  },
  {
    subjectId: 23,
    question: "A Lei Áurea, assinada em 1888, determinou o fim de qual prática no Brasil?",
    correct: "Escravidão",
    incorrect: ["Monarquia", "Censura", "Imigração"],
  },
  // Geografia
  {
    subjectId: 22,
    question: "Qual é a capital do Brasil?",
    correct: "Brasília",
    incorrect: ["São Paulo", "Rio de Janeiro", "Salvador"],
  },
  {
    subjectId: 22,
    question: "Qual é o maior oceano do planeta?",
    correct: "Oceano Pacífico",
    incorrect: ["Oceano Atlântico", "Oceano Índico", "Oceano Ártico"],
  },
  {
    subjectId: 22,
    question: "Qual linha imaginária divide a Terra em hemisférios Norte e Sul?",
    correct: "Linha do Equador",
    incorrect: ["Trópico de Capricórnio", "Meridiano de Greenwich", "Trópico de Câncer"],
  },
  {
    subjectId: 22,
    question: "Em qual continente está localizado o Brasil?",
    correct: "América do Sul",
    incorrect: ["América Central", "Europa", "África"],
  },
  // Matemática
  {
    subjectId: 19,
    question: "Quanto é 7 × 8?",
    correct: "56",
    incorrect: ["48", "54", "64"],
  },
  {
    subjectId: 19,
    question: "Qual é a raiz quadrada de 81?",
    correct: "9",
    incorrect: ["7", "8", "12"],
  },
  {
    subjectId: 19,
    question: "Qual é o resultado de 15% de 200?",
    correct: "30",
    incorrect: ["15", "20", "35"],
  },
  {
    subjectId: 19,
    question: "Quantos graus tem a soma dos ângulos internos de um triângulo?",
    correct: "180 graus",
    incorrect: ["90 graus", "270 graus", "360 graus"],
  },
  // Literatura
  {
    subjectId: 10,
    question: "Quem escreveu o romance Dom Casmurro?",
    correct: "Machado de Assis",
    incorrect: ["José de Alencar", "Carlos Drummond de Andrade", "Clarice Lispector"],
  },
  {
    subjectId: 10,
    question: "Quantos versos normalmente formam um soneto?",
    correct: "14",
    incorrect: ["8", "10", "16"],
  },
  {
    subjectId: 10,
    question: "Qual é o nome da personagem de Dom Casmurro conhecida por seus olhos de ressaca?",
    correct: "Capitu",
    incorrect: ["Iracema", "Aurélia", "Macabéa"],
  },
  {
    subjectId: 10,
    question: "Quem escreveu Os Lusíadas?",
    correct: "Luís de Camões",
    incorrect: ["Fernando Pessoa", "Eça de Queirós", "Padre Antônio Vieira"],
  },
  // Informática
  {
    subjectId: 18,
    question: "Qual linguagem é usada principalmente para estruturar páginas da web?",
    correct: "HTML",
    incorrect: ["SQL", "Python", "CSS"],
  },
  {
    subjectId: 18,
    question: "Qual componente é conhecido como o cérebro do computador?",
    correct: "Processador",
    incorrect: ["Monitor", "Teclado", "Gabinete"],
  },
  {
    subjectId: 18,
    question: "Qual atalho normalmente copia um texto selecionado no computador?",
    correct: "Ctrl + C",
    incorrect: ["Ctrl + V", "Ctrl + X", "Ctrl + Z"],
  },
  {
    subjectId: 18,
    question: "Qual sistema numérico usa apenas os algarismos 0 e 1?",
    correct: "Binário",
    incorrect: ["Decimal", "Romano", "Hexadecimal"],
  },
  // Arte
  {
    subjectId: 25,
    question: "Quem pintou a obra Mona Lisa?",
    correct: "Leonardo da Vinci",
    incorrect: ["Michelangelo", "Vincent van Gogh", "Pablo Picasso"],
  },
  {
    subjectId: 25,
    question: "Quais são as três cores primárias na pintura tradicional?",
    correct: "Vermelho, amarelo e azul",
    incorrect: ["Verde, laranja e roxo", "Preto, branco e cinza", "Rosa, marrom e azul"],
  },
  {
    subjectId: 25,
    question: "Qual técnica cria a sensação de profundidade em uma imagem?",
    correct: "Perspectiva",
    incorrect: ["Colagem", "Gravura", "Modelagem"],
  },
  {
    subjectId: 25,
    question: "O que é uma escultura?",
    correct: "Uma obra artística tridimensional",
    incorrect: ["Uma pintura feita em papel", "Uma música instrumental", "Um texto teatral"],
  },
  // Esportes
  {
    subjectId: 21,
    question: "Quantos jogadores de cada equipe começam uma partida de futebol em campo?",
    correct: "11",
    incorrect: ["5", "7", "15"],
  },
  {
    subjectId: 21,
    question: "Quantos anéis formam o símbolo dos Jogos Olímpicos?",
    correct: "5",
    incorrect: ["4", "6", "7"],
  },
  {
    subjectId: 21,
    question: "Quantos jogadores de cada equipe ficam em quadra no basquete?",
    correct: "5",
    incorrect: ["6", "7", "11"],
  },
  {
    subjectId: 21,
    question: "Qual esporte é conhecido como o esporte da bola oval?",
    correct: "Rugby",
    incorrect: ["Tênis", "Vôlei", "Natação"],
  },
];