// 問題は、先生指定の画像から確認できたものだけを登録する。
const QUESTIONS = [
  {
    id: "vintage_219_848",
    no: 848,
    section: 219,
    type: "blank",
    sentence: "I cannot (    ) a kimono by myself, so my mother always helps me.",
    choices: ["put on", "wear", "wearing", "wear out"],
    answer: "put on",
    japanese: "私は一人で着物を着ることができないので、母がいつも手伝ってくれます。"
  },
  {
    id: "vintage_219_849",
    no: 849,
    section: 219,
    type: "blank",
    sentence: "That hat is just the color I’ve been looking for. May I (    ), please?",
    choices: ["do away with it", "try it on", "tear it off", "search it"],
    answer: "try it on",
    japanese: "その帽子はまさに私が探していた色です。試着してもいいですか。"
  },
  {
    id: "vintage_219_850",
    no: 850,
    section: 219,
    type: "converted_blank",
    sentence: "Please (    ) your shoes after you step into the entrance.",
    choices: ["repair", "remove", "regain", "restrict"],
    answer: "remove",
    japanese: "玄関に入ったら、靴を脱いでください。",
    originalTarget: "take off"
  },
  {
    id: "vintage_219_851",
    no: 851,
    section: 219,
    type: "converted_blank",
    sentence: "He had to (    ) his employees’ request.",
    choices: ["accept", "criticize", "follow", "reject"],
    answer: "reject",
    japanese: "彼は従業員たちの要求を断らなければなりませんでした。",
    originalTarget: "turn down"
  },
  {
    id: "vintage_219_852",
    no: 852,
    section: 219,
    type: "blank",
    sentence: "Hey, I love this song. Could you turn (    ) the volume, please?",
    choices: ["out", "into", "up", "from"],
    answer: "up",
    japanese: "ねえ、この曲好きです。音量を上げてもらえますか。"
  },
  {
    id: "vintage_219_853",
    no: 853,
    section: 219,
    type: "blank",
    sentence: "Please be sure to (    ) the gas before you leave the apartment.",
    choices: ["turn off", "stop off", "blow out", "shut out"],
    answer: "turn off",
    japanese: "アパートを出る前に、必ずガスを止めてください。"
  },
  {
    id: "vintage_1173",
    no: 1173,
    sentence: "Everything has been going well (    ).",
    choices: ["as for", "as yet", "so far", "so long"],
    answer: "so far",
    japanese: "今までのところ、すべて順調にいっている。"
  },
  {
    id: "vintage_1174",
    no: 1174,
    sentence: "We have received no answer (    ).",
    choices: ["as yet", "as for", "so far as", "as long as"],
    answer: "as yet",
    japanese: "今のところ、私達は何の返事も受け取っていない。"
  },
  {
    id: "vintage_1175",
    no: 1175,
    sentence: "The work is (    ) finished.",
    choices: ["as well as", "as good as", "as much as", "as far as"],
    answer: "as good as",
    japanese: "その仕事は終わったも同然だ。"
  },
  {
    id: "vintage_1176",
    no: 1176,
    sentence: "The teacher, (    ) many of the classmates, was present at the party.",
    choices: ["as far as", "as well as", "as long as", "as good as"],
    answer: "as well as",
    japanese: "クラスメートの多くだけでなく、先生もパーティーに出席していた。"
  },
  {
    id: "vintage_1177",
    no: 1177,
    sentence: "(    ), the plan was a success.",
    choices: ["By and by", "By and large", "Over and over", "Far and wide"],
    answer: "By and large",
    japanese: "全般的に見て、その計画は成功だった。"
  },
  {
    id: "vintage_1178",
    no: 1178,
    sentence: "It is (    ) impossible to solve this puzzle in ten minutes.",
    choices: ["next to", "close to", "near to", "side by side"],
    answer: "next to",
    japanese: "このパズルを10分で解くのはほぼ不可能だ。"
  },
  {
    id: "vintage_1179",
    no: 1179,
    sentence: "My score is (    ) the same as last year's.",
    choices: ["more or less", "sooner or later", "once or twice", "all or nothing"],
    answer: "more or less",
    japanese: "私のスコアは去年とだいたい同じだ。"
  },
  {
    id: "vintage_1180",
    no: 1180,
    sentence: "You will have to face the truth (  1  ).",
    choices: ["sooner or later", "more or less", "once in a while", "now and then"],
    answer: "sooner or later",
    japanese: "遅かれ早かれ、君は真実に向き合わなければならなくなるだろう。"
  },
  {
    id: "vintage_1181",
    no: 1181,
    sentence: "I didn't have enough money to call home, (    ) stay at a hotel.",
    choices: ["let alone", "not to speak of", "to say nothing of", "needless to say"],
    answer: "let alone",
    japanese: "私には家に電話する十分なお金さえなかった。ましてやホテルに泊まるお金などなかった。"
  },
  {
    id: "vintage_1182",
    no: 1182,
    sentence: "(    ) fatigue and (    ) bad weather, we decided to give up the climb.",
    choices: ["What with ... what with", "What with ... and what with", "Both with ... and with", "What for ... and for"],
    answer: "What with ... and what with",
    japanese: "疲労やら悪天候やらで、私達はその登山を断念することに決定した。"
  }
];
