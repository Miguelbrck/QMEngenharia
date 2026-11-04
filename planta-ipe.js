/* =====================================================================
   PLANTA 3D · EDIFÍCIO IPÊ  (dados editáveis)
   ---------------------------------------------------------------------
   • Todas as medidas estão em PIXELS da imagem da planta (1536 × 1024).
   • 100 px = 1 metro  (mude "scale" se quiser outra proporção).
   • Retângulos: [x0, y0, x1, y1]  (canto superior-esquerdo → inferior-direito)
   • Para trocar a foto de um cômodo, altere a lista "photos" dele.
   • Para criar a planta de outro empreendimento, copie este arquivo,
     troque a chave (ipe → jacaranda, etc.) e o botão aparece sozinho.
   ===================================================================== */
window.QM_PLANS = window.QM_PLANS || {};

window.QM_PLANS.ipe = {
  title: 'Edifício Ipê',
  image: 'image/planta.webp',   // piso (a própria planta, já sem a marcação vermelha)
  imageSize: [1536, 1024],
  origin: [763, 464],                       // ponto da imagem que fica no centro da cena
  scale: 0.01,                              // metros por pixel
  wallHeight: 2.7,                          // pé-direito (m)

  /* PAREDES */
  walls: [
    /* lavanderia + cozinha */
    [590, 31, 742, 50], [828, 31, 942, 50],
    [590, 31, 610, 437], [590, 177, 628, 200],
    [922, 31, 942, 200], [692, 177, 945, 200],
    [942, 160, 1113, 182], [1095, 160, 1113, 255],
    /* sala de estar */
    [1113, 195, 1500, 215], [1480, 195, 1500, 748], [805, 728, 1500, 748],
    /* banheiro social + quarto */
    [785, 612, 806, 897], [705, 612, 806, 633],
    [612, 612, 642, 897], [602, 612, 642, 633],
    [228, 877, 352, 897], [492, 877, 643, 897], [720, 877, 806, 897],
    [228, 612, 248, 897], [228, 612, 538, 633],
    /* suíte */
    [227, 173, 367, 195], [513, 173, 610, 195],
    [227, 173, 247, 357], [227, 470, 247, 527], [227, 508, 610, 527],
    /* varanda */
    [26, 265, 45, 898], [26, 880, 228, 898], [305, 527, 322, 548]
  ],

  /* JANELAS (vãos nas paredes) */
  windows: [
    [742, 31, 828, 50], [367, 173, 513, 195], [227, 357, 247, 470],
    [352, 877, 492, 897], [643, 877, 720, 897]
  ],

  /* GUARDA-CORPO de vidro da varanda */
  railings: [ [45, 262, 227, 268] ],

  /* CÔMODOS: polígono (clique/destaque), posição da etiqueta e fotos */
  rooms: [
    { id: 'suite', name: 'Suíte', label: [420, 385],
      poly: [[247,195],[592,195],[592,437],[610,437],[610,508],[592,508],[247,508]],
      photos: ['photos/suite.jpg'],
      note: 'Dormitório principal com cabeceira estofada, painel ripado iluminado, TV e bancada de trabalho.' },

    { id: 'quarto', name: 'Quarto', label: [400, 745],
      poly: [[248,633],[538,633],[538,612],[602,612],[602,633],[612,633],[612,877],[248,877]],
      photos: ['photos/suite.jpg'],
      note: 'Foto ilustrativa do dormitório.' },

    { id: 'banheiro', name: 'Banheiro Social', label: [713, 735],
      poly: [[642,633],[642,612],[705,612],[705,633],[785,633],[785,877],[642,877]],
      photos: ['photos/banheiro.jpg'],
      note: 'Box de vidro com ducha, bancada em granito preto e espelho redondo com LED.' },

    { id: 'lavanderia', name: 'Lavanderia', label: [766, 118],
      poly: [[610,50],[922,50],[922,177],[692,177],[692,200],[628,200],[628,177],[610,177]],
      photos: ['photos/lavanderia.jpg'],
      note: 'Bancada com tanque, espaço para máquina de lavar e armário alto.' },

    { id: 'cozinha', name: 'Cozinha', label: [790, 318],
      poly: [[610,200],[940,200],[940,612],[610,612]],
      photos: ['photos/cozinha.jpg'],
      note: 'Cozinha integrada, com ilha em granito preto, bancos altos e iluminação em LED.' },

    { id: 'jantar', name: 'Sala de Jantar', label: [1020, 480],
      poly: [[940,182],[1095,182],[1095,255],[1113,255],[1113,728],[805,728],[805,612],[940,612]],
      photos: ['photos/sala.jpg'],
      note: 'Mesa para seis lugares, integrada à sala de estar.' },

    { id: 'estar', name: 'Sala de Estar', label: [1290, 520],
      poly: [[1113,215],[1480,215],[1480,728],[1113,728]],
      photos: ['photos/sala.jpg'],
      note: 'Sofá amplo, painel ripado com TV e iluminação indireta.' },

    { id: 'varanda', name: 'Varanda Externa', label: [135, 570],
      poly: [[45,265],[227,265],[227,527],[305,527],[305,612],[227,612],[227,880],[45,880]],
      photos: ['photos/varanda.png'],
      note: '' }
  ],

  /* MÓVEIS (volumes simples; o topo recebe o desenho da própria planta)
     h = altura (m) · y = altura da base (m) · side = cor das laterais */
  furniture: [
    /* suíte */
    { room: 'suite',  rect: [264, 280, 474, 455], h: 0.55, side: '#d9d0c1' },   // cama
    { room: 'suite',  rect: [270, 208, 314, 276], h: 0.45, side: '#b9763a' },   // criado-mudo
    { room: 'suite',  rect: [270, 464, 314, 508], h: 0.45, side: '#b9763a' },   // criado-mudo
    { room: 'suite',  rect: [317, 203, 548, 238], h: 1.5,  side: '#b9763a' },   // armário (parede)
    { room: 'suite',  rect: [550, 203, 591, 396], h: 1.5,  side: '#b9763a' },   // roupeiro
    /* quarto */
    { room: 'quarto', rect: [268, 681, 447, 820], h: 0.55, side: '#d9d0c1' },   // cama
    { room: 'quarto', rect: [268, 820, 317, 873], h: 0.45, side: '#b9763a' },   // criado-mudo
    { room: 'quarto', rect: [570, 711, 610, 870], h: 1.5,  side: '#b9763a' },   // roupeiro
    /* banheiro */
    { room: 'banheiro', rect: [751, 641, 784, 746], h: 0.85, side: '#25221f' }, // bancada
    { room: 'banheiro', rect: [728, 758, 785, 791], h: 0.42, side: '#f1eee7' }, // vaso
    /* lavanderia */
    { room: 'lavanderia', rect: [770, 52, 822, 92], h: 0.9, side: '#7b7b78' },  // tanque/máquina
    { room: 'lavanderia', rect: [832, 52, 862, 100], h: 0.85, side: '#d8d8d4' },
    /* cozinha */
    { room: 'cozinha', rect: [696, 201, 944, 254], h: 0.92, side: '#1d1b19' },  // bancada com pia
    { room: 'cozinha', rect: [724, 363, 912, 444], h: 0.92, side: '#1d1b19' },  // ilha
    { room: 'cozinha', rect: [612, 277, 661, 424], h: 1.5, side: '#8d9094' },  // geladeira
    { room: 'cozinha', kind: 'cyl', c: [762, 466], r: 17, h: 0.68, side: '#3a342f' }, // bancos
    { room: 'cozinha', kind: 'cyl', c: [820, 466], r: 17, h: 0.68, side: '#3a342f' },
    { room: 'cozinha', kind: 'cyl', c: [878, 466], r: 17, h: 0.68, side: '#3a342f' },
    /* sala de jantar */
    { room: 'jantar', rect: [977, 404, 1058, 569], h: 0.76, side: '#a8672d' },  // mesa
    { room: 'jantar', rect: [999, 379, 1037, 400], h: 0.48, side: '#4f5434' },  // cadeiras
    { room: 'jantar', rect: [999, 574, 1037, 597], h: 0.48, side: '#4f5434' },
    { room: 'jantar', rect: [949, 407, 974, 442], h: 0.48, side: '#4f5434' },
    { room: 'jantar', rect: [949, 457, 974, 492], h: 0.48, side: '#4f5434' },
    { room: 'jantar', rect: [949, 515, 974, 550], h: 0.48, side: '#4f5434' },
    { room: 'jantar', rect: [1061, 407, 1086, 442], h: 0.48, side: '#4f5434' },
    { room: 'jantar', rect: [1061, 457, 1086, 492], h: 0.48, side: '#4f5434' },
    { room: 'jantar', rect: [1061, 515, 1086, 550], h: 0.48, side: '#4f5434' },
    { room: 'jantar', rect: [809, 651, 867, 719], h: 0.45, side: '#b9763a' },   // jardineira
    /* sala de estar */
    { room: 'estar', rect: [1150, 273, 1246, 577], h: 0.8, side: '#cdc2b3' },   // sofá
    { room: 'estar', kind: 'cyl', c: [1308, 447], r: 38, h: 0.4, side: '#5a3a26' }, // mesa de centro
    { room: 'estar', rect: [1427, 637, 1473, 715], h: 0.45, side: '#b9763a' },   // jardineira
    { room: 'estar', rect: [1449, 336, 1463, 558], h: 0.55, y: 0.9, side: '#111111', flat: '#0d0d0d' } // TV
  ]
};
