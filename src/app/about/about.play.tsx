import { FigureTable } from "@/components/about/FigureTable";
import { Screenshot, ScreenshotRow } from "@/components/about/Screenshot";
import { BOARD_THEMES } from "@/components/board/Board.constants";
import { MATCH_SIZES } from "@/lib/history/liveMatch";
import { MESSAGE_MAX } from "@/lib/history/reactions.constants";
import { INBOX_KEEP_DAYS } from "@/lib/inbox/inbox.constants";
import { MESSAGE_TEXT_MAX } from "@/lib/messages/messages.constants";
import { MOSAIC_COPY, MOSAIC_LONGEST_SIDE, MOSAIC_MOST_TILES } from "@/lib/record/mosaic.constants";

import { ABOUT_CHAPTERS } from "./about.chapters";
import type { AboutSection } from "./about.constants";
import { Game, Inside } from "./about.links";
import { SHOTS } from "./about.shots";

/**
 * PLAYING HERE: what the site does once a game is under way, shown rather
 * than listed.
 *
 * The chapters before this one say what the games are and where they came
 * from; none of them said what it is like to play one here, and the features a
 * member meets every day — the move slider, the picture of every position, the
 * notes that travel with a move — were on no page a newcomer reads. Every
 * screenshot is of a local copy of the site playing real games between the
 * computer players. Every limit printed is read from the constant that
 * enforces it.
 */

const THEMES = Object.values(BOARD_THEMES).map((theme) => theme.label);
const PAIRED = MATCH_SIZES.filter((size) => size > 1);

/** "two, four or six", from the sizes a paired match allows. */
function spoken(sizes: readonly number[]): string {
  const words: Record<number, string> = { 2: "two", 3: "three", 4: "four", 5: "five", 6: "six", 8: "eight" };
  const said = sizes.map((size) => words[size] ?? String(size));
  return said.length < 2 ? said.join("") : `${said.slice(0, -1).join(", ")} or ${said.at(-1)}`;
}

/** "Kaya, Shin-kaya and Washi". */
function listed(items: readonly string[]): string {
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

export const BOARD_SECTION: AboutSection = {
  title: "At the board",
  chapter: ABOUT_CHAPTERS.play,
  kanji: "盤上",
  paragraphs: [
    <>
      The board is the same on a desk and on a phone. You put a stone down, look at it, and then send it. On a phone
      the stone says which point it landed on, four arrows move it one point at a time before you send it, and the
      Send button stays at the bottom of the screen. Every button and list is big enough for a thumb. Against a
      computer player, a switch on the board lets a touch play the move straight away, and the site remembers
      your choice.
    </>,
    <>
      The board helps without playing for you. When a capture is forced, or you have only one or two legal moves,
      it marks them, dims the rest, and says why. When you have no legal move at all, it passes for you and says
      so on both boards. <Game variant="go">Go</Game> gets extra help for beginners: a cross where a stone may not
      go, a ring on the point that captures or saves a group in atari, and a warning before a stone fills your own
      eye. When a game ends, a card over the board says who won and why, what the game paid in experience, and
      offers a rematch.
    </>,
    <>
      Around a live game: a note to send with your move, either one of the ready-made lines (&ldquo;Hello, good
      luck&rdquo;, &ldquo;No rush&rdquo;) or your own words with an emoji. There is a notes box that is private and
      stays in your browser, a button to turn the board round and see it from the other side, and a choice of board
      size. Resign is there too.
    </>,
    <>
      The <em>practice board</em> is the one you can just start using. You play both sides, take moves back, ask
      whether either side has a winning line, and paste in a game from ItsYourTurn or GoldToken to step through it.
      Nothing played there is rated. <em>Just the board</em> opens the board on its own, over the page, with only
      the controls you need to play, or a finished game's slider; Esc or Close takes you back, and it stays on from
      game to game until you do. The wood is your choice too: {listed(THEMES)}.
    </>,
    <>
      Starting a game takes one screen. It shows the game, the board, who you are playing, every rule and which
      colour you take, and one press begins it. The computer players are listed there by name and grade, each
      with a note saying how it actually did against the grades on either side of it.
    </>,
  ],
  figures: {
    0: (
      <ScreenshotRow
        shots={[SHOTS.boardDesk, SHOTS.boardPhone]}
        caption={
          <>
            The practice board at <Game variant="freestyle">Gomoku</Game>, twelve moves in, on a desk and on a
            phone. The panel beside it has spotted that Black can force a win.
          </>
        }
      />
    ),
    2: (
      <Screenshot
        {...SHOTS.vsComputer}
        caption={
          <>
            Eight moves into a game of <Game variant="freestyle">Gomoku</Game> against Rafa Duarte, one
            of the named computer players. The notes and emoji under the board go with your next move.
          </>
        }
      />
    ),
    4: (
      <Screenshot
        {...SHOTS.setUp}
        caption="Choosing who to play. The named computer players have styles as well as grades: attacking, defensive, or changeable."
      />
    ),
  },
};

const CONTROLS = (
  <FigureTable
    head={["Control", "What it does"]}
    rows={[
      ["The slider", "Drag from the first move to the last. The board shows that position, with its move number and the point played."],
      ["Start · Back · Forward · End", "One move at a time, or straight to either end."],
      ["The move list", "Every move, numbered. Click one to jump to it."],
      ["Fork", "Shown once you step back in a game you played: a new game from exactly that position, against the same opponent."],
      [MOSAIC_COPY.openLabel, "The whole game as one picture, the size of your screen. See the next section."],
      ["SGF", "Download a finished game as an SGF file, the format game-record programs read, for every game SGF has a number for."],
      ["Applause", "Five emoji anyone can leave on a finished game, to say it was worth playing."],
    ]}
    caption="The controls under a finished game's board. A game played at one screen has the same slider."
  />
);

export const REPLAY_SECTION: AboutSection = {
  title: "Every move, forwards and back",
  chapter: ABOUT_CHAPTERS.play,
  kanji: "再生",
  paragraphs: [
    <>
      Every game here keeps its moves, and you can go back to any of them. A finished game opens on its final
      position with a slider beside the board. Drag it, step with the arrows under it, or press Play, and the board
      shows that position with its move number and where the stone went. The move list beside it jumps to any
      move you click. A game in play shows its moves in the same panel, and a game played by two people at one
      screen has the same slider.
    </>,
    <>
      Above a finished game, a head-to-head card counts how the two players stand against each other: wins each,
      draws, the current streak, and when they last played. In a game you played, step back to an earlier
      position and <em>Fork</em> appears: a second game starting from exactly that position, against the same
      opponent. Like any other offer of a game, or a rematch, it waits until they accept it.
    </>,
  ],
  figures: {
    0: (
      <ScreenshotRow
        shots={[SHOTS.replayDesk, SHOTS.replayPhone]}
        caption={
          <>
            A finished game of <Game variant="reversi">Reversi</Game> between two computer players, with the
            slider dragged back to move 33 of 60. The head-to-head card sits above the board.
          </>
        }
      />
    ),
    1: CONTROLS,
  },
};

export const PICTURE_SECTION: AboutSection = {
  title: "The game as one picture",
  chapter: ABOUT_CHAPTERS.play,
  kanji: MOSAIC_COPY.kanji,
  paragraphs: [
    <>
      Beside every game&rsquo;s move list is a quiet button, <em>{MOSAIC_COPY.openLabel}</em>. It opens the game as
      one picture: every position in order, one small board per move, laid out to fill an image the exact size of
      your screen. Your desk&rsquo;s screen, a laptop or a phone, so the picture fits as a wallpaper.{" "}
      <em>{MOSAIC_COPY.download}</em> saves it as a PNG. Your own browser draws it from the moves the page
      already has. Nothing is sent anywhere and nothing is stored, so a refresh simply draws it again.
    </>,
    <>
      A long game has more moves than a picture has room for. Past {MOSAIC_MOST_TILES} boards, each one gets too
      small to read as a game, so a long game offers a choice: the whole game with moves skipped evenly, or the
      ending, counted back from the last move. The empty tiles after the last move can hold the game&rsquo;s
      details: the players, the game, the result, the date and the site. The largest picture is{" "}
      {MOSAIC_LONGEST_SIDE.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} pixels on its long side, which is a
      4K screen.
    </>,
    <>
      The same picture appears in four more places. A game in play shows every position so far and redraws after
      each move. A player&rsquo;s own page can put their games of one kind side by side, each as it ended, won,
      lost or all. Every game&rsquo;s page shows how the most recent games played here ended, and each tile leads
      to its game. <Inside href="/famous">Famous games</Inside> replays championship and historic games, AlphaGo
      against Lee Sedol among them, through this site&rsquo;s own rules, and makes a picture of every move from
      each of them.
    </>,
  ],
  figures: {
    0: (
      <Screenshot
        {...SHOTS.pictureWindow}
        caption={
          <>
            The picture window over a long game of <Game variant="go">Go</Game> on the 9×9 board. It has more
            positions than {MOSAIC_MOST_TILES} tiles, so it offers the two ways of fitting it.
          </>
        }
      />
    ),
    1: (
      <ScreenshotRow
        shots={[SHOTS.wallDesk, SHOTS.wallPhone]}
        caption={
          <>
            Two downloaded pictures, exactly as the button saves them. On the left, a{" "}
            <Game variant="reversi">Reversi</Game> game of 60 moves sized for a 1920×1080 screen. On the right, a{" "}
            <Game variant="connect6">Connect6</Game> game sized for a phone, with its details in the spare tiles.
          </>
        }
      />
    ),
    2: (
      <ScreenshotRow
        shots={[SHOTS.gamePage, SHOTS.famous]}
        caption={
          <>
            The <Game variant="go">Go</Game> page, with the final positions of games played here in its side
            column, and <Inside href="/famous">Famous games</Inside>, opening with the 2016 match between Lee Sedol
            and AlphaGo.
          </>
        }
      />
    ),
  },
};

const WHERE = (
  <FigureTable
    head={["What", "Where", "In short"]}
    rows={[
      ["Play, rematch, fork", "A player's page, a finished game", "An offer until the other player accepts it. Declining costs nothing, and you can withdraw it."],
      ["Paired games", "Setting up a game", `A match of ${spoken(PAIRED)} games at once against one player, taking each colour in turn.`],
      ["The waiting room", <Inside key="games" href="/games">Games</Inside>, "Everyone waiting for a game, with rating, time limit and country. Sit down shows you the game before you join."],
      ["A note with a move", "Beside Send", `An emoji and up to ${MESSAGE_MAX} characters, which arrive with the move.`],
      ["Messages", "A player's page", `Up to ${MESSAGE_TEXT_MAX} characters, delivered to their inbox. Ignoring somebody stops messages both ways.`],
      ["Inbox", <Inside key="inbox" href="/inbox">Inbox</Inside>, `What happened while you were away: a game finished, a game offered, a seat taken, a note. Kept ${INBOX_KEEP_DAYS} days.`],
      ["Buddies", <Inside key="me" href="/me">Your own page</Inside>, "The people you know, whether they are around, the games between you, and Play beside each name."],
      ["A head start", "Setting up a game", "Free turns for the weaker player, or the traditional handicap in Go, Othello and draughts. It does not count toward ratings."],
      ["Four words", "Somebody else's device", "Tap your four words to take your own seat on a shared tablet, with nothing to type."],
      ["A seat link", "Beside the board", "A link or QR code for an empty seat, to hand to whoever should sit in it."],
      ["Language", "The menu under your name", "English or Japanese, kept on your account so it follows you to every device."],
    ]}
    caption="Where to find the things that happen between players. None of them costs anything."
  />
);

export const PEOPLE_SECTION: AboutSection = {
  title: "Playing with people",
  chapter: ABOUT_CHAPTERS.play,
  kanji: "相手",
  paragraphs: [
    <>
      Most games here are slow. You make a move, and your opponent answers when they get to it. When you send a
      move, the next game waiting on you opens by itself, oldest first. A note can go with a move: pick an emoji,
      write a line beside Send, and it arrives with the move. Nothing is bound to another person until they agree
      to it. A challenge, a rematch or a fork waits in their list with Accept and Decline.
    </>,
    <>
      The table above says where each of these lives. The <Inside href="/players">players</Inside> page lists
      everyone, sortable by every column, and the computer players are listed with everybody else. The{" "}
      <Inside href="/xp">XP board</Inside> ranks everyone by experience, and can count people, computers or
      both.
    </>,
  ],
  figures: {
    0: WHERE,
    1: (
      <ScreenshotRow
        shots={[SHOTS.computerPlayer, SHOTS.xpBoard]}
        caption="A computer player's page, showing how it measured against the grades beside it at each game, and the XP board. Both are from the local copy the screenshots were taken on, which held only a handful of players."
      />
    ),
  },
};
