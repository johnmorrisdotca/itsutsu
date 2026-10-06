/**
 * EVERY LIST A PUZZLE READS, READABLE WHERE THERE IS NO BROWSER. A browser
 * fetches a list as its own script; a server, a unit test and a browser spec's
 * own process read one through its module, and importing this is importing all
 * of them. For the server's checks of any puzzle (`prepareOnServer.ts`) and
 * the tests: never a page, which would carry every list to read one
 * (`listTracing.coverage.test.ts`). A page that reads a list imports that
 * list's own module.
 */
import "./dailyWords/dailyPoolsModule";
import "./gomoji/popWordsModule";
import "./gomoji/wordDataModule";
import "./gomojiKana/kanaWordsModule";
import "./kumimoji/tileWordsModule";
import "./meikyuu/levelsModule";
import "./tsunagi/layoutsModule";
