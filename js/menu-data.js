// Menu — nome turco (linha fina) + nome em português (linha forte), como na referência do menu.
// As fotos são provisórias (Wikimedia Commons, ver creditos.html) até chegarem as do restaurante.
window.MENU = [
  { id: 'humus', cat: 'entradas', tr: 'Humus', pt: 'Pasta de grão',
    desc: 'Grão-de-bico esmagado com tahini, limão e alho, com um fio de azeite e pimenta pul biber por cima. Para partilhar com pão quente.',
    ingr: ['Grão-de-bico', 'Tahini', 'Limão', 'Alho', 'Azeite', 'Pul biber'] },
  { id: 'mercimek', cat: 'entradas', tr: 'Mercimek çorbası', pt: 'Sopa de lentilhas',
    desc: 'A sopa que abre qualquer refeição turca: lentilha vermelha, cebola e cenoura, com manteiga de pimentão e limão ao lado.',
    ingr: ['Lentilha vermelha', 'Cebola', 'Cenoura', 'Hortelã seca', 'Limão'] },
  { id: 'lahmacun', cat: 'entradas', tr: 'Lahmacun', pt: 'Pão fino com carne',
    desc: 'Massa fina e estaladiça, coberta com carne picada, tomate e pimento, feita no forno. Enrola-se com salsa, cebola e limão.',
    ingr: ['Massa fina', 'Carne picada', 'Tomate', 'Pimento', 'Salsa', 'Limão'] },
  { id: 'sis', cat: 'principais', tr: 'Şiş kebap', pt: 'Espetadas no carvão',
    desc: 'Pedaços de carne marinados em iogurte, alho e pimentão, enfiados no espeto e grelhados no carvão. Chegam à mesa ainda no espeto.',
    ingr: ['Carne em cubos', 'Iogurte', 'Alho', 'Pimentão', 'Tomilho', 'Pão lavash'] },
  { id: 'adana', cat: 'principais', tr: 'Adana kebap', pt: 'Espetada picante',
    desc: 'Carne picada de borrego com pimento vermelho e especiarias, moldada no espeto largo e grelhada no carvão. Vem com pão lavash e salada de cebola com sumagre.',
    ingr: ['Borrego picado', 'Pimento vermelho', 'Pul biber', 'Cebola com sumagre', 'Pão lavash'] },
  { id: 'iskender', cat: 'principais', tr: 'İskender kebap', pt: 'Carne com iogurte',
    desc: 'Fatias finas de carne sobre pão pide, com molho de tomate, iogurte e manteiga quente deitada à mesa.',
    ingr: ['Carne em fatias', 'Pão pide', 'Molho de tomate', 'Iogurte', 'Manteiga'] },
  { id: 'kofte', cat: 'principais', tr: 'Fırın köfte', pt: 'Almôndegas no forno',
    desc: 'Almôndegas de carne grelhadas e depois acabadas no forno com molho de tomate, batata e pimento verde.',
    ingr: ['Carne picada', 'Molho de tomate', 'Batata', 'Pimento verde', 'Cominhos'] },
  { id: 'pirzola', cat: 'principais', tr: 'Kuzu pirzola', pt: 'Costeletas de borrego',
    desc: 'Costeletas de borrego marinadas em alho, tomilho e azeite, grelhadas no carvão e servidas com legumes da grelha.',
    ingr: ['Costeletas de borrego', 'Alho', 'Tomilho', 'Azeite', 'Legumes grelhados'] },
  { id: 'bife', cat: 'principais', tr: 'Dana biftek', pt: 'Bife na brasa',
    desc: 'Corte de novilho grelhado no carvão ao seu ponto, com batata e legumes assados na mesma grelha.',
    ingr: ['Novilho', 'Sal grosso', 'Pimenta preta', 'Batata', 'Legumes assados'] },
  { id: 'baklava', cat: 'sobremesas', tr: 'Baklava', pt: 'Folhado de pistácio',
    desc: 'Camadas finíssimas de massa filo com pistácio, regadas com calda. Pede um chá turco ao lado.',
    ingr: ['Massa filo', 'Pistácio', 'Manteiga', 'Calda de açúcar'] },
  { id: 'kunefe', cat: 'sobremesas', tr: 'Künefe', pt: 'Queijo em kadaif',
    desc: 'Queijo derretido entre fios de massa kadaif estaladiços, servido quente com calda e pistácio.',
    ingr: ['Massa kadaif', 'Queijo', 'Calda', 'Pistácio'] },
  { id: 'cay', cat: 'sobremesas', tr: 'Çay', pt: 'Chá turco',
    desc: 'Chá preto forte, servido no copo de vidro em forma de tulipa. É assim que se termina a refeição.',
    ingr: ['Chá preto', 'Açúcar em cubos'] },
];

window.CATS = { entradas: 'Entradas', principais: 'Pratos principais', sobremesas: 'Doces e chá' };

// Número de WhatsApp do restaurante para as reservas (formato internacional, só dígitos).
// Vazio: o WhatsApp abre e o cliente escolhe o contacto.
window.WHATSAPP = '';
