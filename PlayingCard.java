import java.util.ArrayList;
import java.util.Random;

class PlayingCard {
    char suit;
    char rank;

    public PlayingCard(char suit, char rank) {
        this.suit = suit;
        this.rank = rank;
    }

    public String getUnicode() {
        int codePoint = 0;
        switch(suit) {
            case '♠':
                codePoint += 0x1F0A1;
                break;
            case '♡':
                codePoint += 0x1F0B1;
                break;
            case '♢':
                codePoint += 0x1F0C1;
                break;
            case '♣':
                codePoint += 0x1F0D1;
                break;
            default:
                System.out.println("The card cannot be displayed because it doesn't have a proper suit.");
        }
        switch(rank) {
            case 'A':
                codePoint += 0;
                break;
            case '5':
                codePoint += 5;
                break;
            case '6':
                codePoint += 6;
                break;
            case '7':
                codePoint += 7;
                break;
            case '8':
                codePoint += 8;
                break;
            case '9':
                codePoint += 9;
                break;
            case 'X':
                codePoint += 10;
                break;
            case 'J':
                codePoint += 11;
                break;
            case 'Q':
                codePoint += 12;
                break;
            case 'K':
                codePoint += 13;
                break;
            default:
                System.out.println("The card cannot be displayed because it doesn't have a proper rank.");
        }
        return new String(Character.toChars(codePoint));
    }
}

class CardGenerator {
    static char[] suits = {'♠','♡','♢','♣'};
    static char[] ranks = {'A','5','6','7','8','9','X','J','Q','K'};

    private static int getRandomInt(int min, int max) {
        if (min >= max) {
            throw new IllegalArgumentException("Max must be greater than min for random integer generation.");
        }
        Random r = new Random();
        return r.nextInt(max - min) + min;
    }

    public static void generate(Hand[] hands) //WARNING: IMPURE
    {
        int numberOfPlayers = hands.length;
        for (char suit : suits) {
            for (char rank : ranks) {
                int n = 0;
                do {    //Select random player with fewer than 10 cards
                    n = getRandomInt(0,numberOfPlayers);
                    //System.out.println("Random player selected for next card: " + n);
                } while (hands[n].getNumCards() >= 10);

                try {
                    hands[n].giveCard(new PlayingCard (suit, rank));
                } catch (Exception e) {
                    System.out.println(e);
                }
            }
        }
    }
}

class Hand {
    ArrayList<PlayingCard> cards;

    public Hand() {
        cards = new ArrayList<PlayingCard>();
    }

    public String toString() {
        return "Test string. The object exists tho";
    }

    public void giveCard (PlayingCard card) throws Exception {   //WARNING: IMPURE
        if (cards.size() >= 10) {
            throw new Exception("A player can have at most only 10 cards.");
        }
        if (cards.indexOf(card) != -1) {
            throw new Exception("Card is already in hand.");
        }
        cards.add(card);
    }

    public PlayingCard playCard (PlayingCard card) throws Exception {    //WARNING: IMPURE
        int index = cards.indexOf(card);
        if (index == -1) {
            throw new Exception("Card to play is not in hand.");
        }
        return cards.remove(index);
    }

    public int getNumCards () {
        return cards.size();
    }

    public PlayingCard[] getCards () {
        return cards.toArray(new PlayingCard[cards.size()]);
    }
}
