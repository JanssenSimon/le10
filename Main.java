public class Main {
    static Hand[] playerhands;

    private static PlayingCard fromUnicode(String uniCard, int playerIndex) throws Exception{
        for (PlayingCard c : playerhands[playerIndex].getCards()) {
            if (c.getUnicode() == uniCard) {
                return c;
            }
        }
        throw new Exception("Player does not have requested card.");
    }

    public static void main(String[] args) {
        // Initialize game
        System.out.println("Initializing player hands...");
        playerhands = new Hand[4];
        for (int i = 0; i<4; i++) {
            playerhands[i] = new Hand();
        }
        System.out.println("Generating cards...");
        CardGenerator.generate(playerhands);

        // Game execution
        System.out.println("Player 1's hand:");
        for (PlayingCard c : playerhands[0].getCards()) {
            System.out.print(c.getUnicode() + " ");
        }
        System.out.println("");
        System.out.println("Player 2's hand:");
        for (PlayingCard c : playerhands[1].getCards()) {
            System.out.print(c.getUnicode() + " ");
        }
        System.out.println("");
        System.out.println("Player 3's hand:");
        for (PlayingCard c : playerhands[2].getCards()) {
            System.out.print(c.getUnicode() + " ");
        }
        System.out.println("");
        System.out.println("Player 4's hand:");
        for (PlayingCard c : playerhands[3].getCards()) {
            System.out.print(c.getUnicode() + " ");
        }
        System.out.println("");

        System.out.println("Player 1 plays the following card:");
        try {
            System.out.println(playerhands[0].playCard(playerhands[0].getCards()[0]).getUnicode());
        } catch (Exception e) {
            System.out.println("Error playing card");
        }
        System.out.println("Player 1's hand now:");
        for (PlayingCard c : playerhands[0].getCards()) {
            System.out.print(c.getUnicode() + " ");
        }
        System.out.println("");
    }
}
