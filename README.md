# OSRS Main Journey

Painel pessoal para acompanhar a progressão de uma conta do Old School RuneScape.

## Recursos

- metas principais e objetivos menores;
- roadmap editável;
- sessão diária e histórico;
- níveis sincronizados pelo Wise Old Man;
- acompanhamento de bosses, raids e invocations;
- múltiplos personagens com progresso independente;
- consulta do Grand Exchange com favoritos, volume e histórico de preços;
- money makers editáveis e cálculo do lucro real por sessão;
- planejamento de upgrades, skills, rotinas, drops, diaries e Combat Achievements;
- Achievement Diaries completas, com tarefas, requisitos, filtros e progresso do WikiSync;
- Combat Achievements com catálogo da Wiki, pontos, recompensas e metas automáticas;
- Collection Log por item e por página, importado do `collection_log.json` gerado pelo plugin Character Export do RuneLite;
- Banco por personagem, importado do `bank.json` do Character Export, com caixa em moedas e valor negociável estimado pela OSRS Wiki;
- Gear Lab com defesas, formas, fraquezas e resumo estratégico do alvo vindos da OSRS Wiki, usados no cálculo de precisão e DPS;
- calculadoras de XP, Banked XP, combat level, margem do GE, drop chance, Prayer e suprimentos;
- Gear Lab com boneco de equipamentos, busca por slot, ícones, atributos, DPS básico, presets e comparação;
- Central de Slayer com task manual, bestiário de fraquezas e locais, métodos pessoais, block list e guia interativo de Turael Boosting;
- recomendador de atividades por tempo, intensidade e objetivo;
- temas e trilha sonora inspirados em Gielinor.

O projeto é uma aplicação estática e mantém os dados personalizados no armazenamento local do navegador. Atualizações de estrutura usam migração incremental e mantêm backups locais de segurança dos dados anteriores.

Os níveis e KCs vêm do Wise Old Man. Quests, Diaries e Combat Achievements usam o WikiSync. O Collection Log é importado pelo botão próprio da aba a partir do `collection_log.json` do plugin Character Export do RuneLite; essa separação evita que um snapshot vazio apague itens já registrados. Catálogos e requisitos usam a OSRS Wiki, preços usam a API de preços da Wiki e equipamentos usam dados públicos derivados do cache do jogo, RuneLite e Wiki.
