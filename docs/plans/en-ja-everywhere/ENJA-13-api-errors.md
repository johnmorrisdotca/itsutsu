# ENJA-13. API errors a person can see, in their language

Board key: `api-errors-a-person-can-see-in-their-language`.
Kind: fix. Priority low. Needs ENJA-02.

## Why

About 250 English strings in `src/app/api/`. Only the ones a page shows to a
person matter: "that name is taken", "twenty games at once", and so on.

## Do

1. A route returns an error key and its values, never a sentence. The page says it through the speaker.
2. Leave log-only and operator-only messages in English, and mark the folder's rule in the gate.

## Done when

`src/app/api` is off the pending list, apart from a written list of operator-only routes.
