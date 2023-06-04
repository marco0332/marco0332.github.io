// 심볼: 트럼프
class TrumpCard {
    // 내연: 몸이 납작하고 두 손과 두 발은 네모 귀퉁이에 달려 있는 것
}

// 심볼: 토끼
class Rabbit {
    // 내연: 귀가 길고 앞발은 짧고 뒷발은 길어 깡충깡충 뛰어다니는 것
}

// 심볼: 정원사
class Gardener extends TrumpCard { }

// 심볼: 클로버 병사
class CloverSoldier extends TrumpCard { }

// 심볼: 신하
class Courtier extends TrumpCard { }

// 심볼: 왕자
class Prince extends TrumpCard { }

// 심볼: 공주
class Princess extends TrumpCard { }

// 심볼: 왕
class King extends TrumpCard { }

// 심볼: 왕비
class Queen extends TrumpCard { }

// 심볼: 하트 왕
class HeartKing extends TrumpCard { }

// 심볼: 하트 여왕
class HeartQueen extends TrumpCard { }

// 심볼: 하얀 토끼
class WhiteRabbit extends Rabbit { }

// 외연: 트럼프 집합
const TrumpCardList: TrumpCard[] = [
    new Gardener(),
    new CloverSoldier(),
    new Courtier(),
    new Prince(),
    new Princess(),
    new King(),
    new Queen(),
    new HeartKing(),
    new HeartQueen(),
];

// 외연: 토끼 집합
const RabbitList: Rabbit[] = [
    new WhiteRabbit()
];

class Alice {
    height: number

    constructor(height: number) {
        this.height = height;
    }

    isAlice<T>(compared: T) {
        return compared instanceof Alice;
    }
}

const a80 = new Alice(80);
const a100 = new Alice(100);
const a300 = new Alice(300);
const a400 = new Alice(400);
const gardener = new Gardener();

a80.isAlice(a100); // true
a100.isAlice(a300); // true
a300.isAlice(a400); // true
a400.isAlice(gardener); // false