ALTER TABLE `activities` ADD `ftp_voorstel_antwoord` text;--> statement-breakpoint
-- ROADMAP punt 69 — DE SEED, en dit is het STARTPUNT van het FTP-voorstel.
-- Alles wat op dit moment al in de tabel staat geldt als beantwoord en levert dus nooit een voorstel;
-- wat hierna binnenkomt heeft de kolom leeg en doorloopt de poorten gewoon.
-- WAAROM DIT HIER STAAT EN NIET ALS CONSTANTE IN DE BRON: een datumgrens (`datum > D`) is rekenkundig
-- identiek aan een leeftijdsgrens (`leeftijd < vandaag - D) en groeit elke dag mee zonder besluit.
-- Deze seed is één handeling die daarna nooit meer verandert.
-- VORM-AFWIJKING, bewust: de migraties 0000 t/m 0013 zijn puur schema en komen uit `drizzle-kit
-- generate`. Deze regel is met de hand toegevoegd en komt dus NIET uit `schema.ts` terug. Dat is
-- veilig omdat de generator alleen NIEUWE migraties schrijft en toegepaste bestanden niet herschrijft.
UPDATE `activities` SET `ftp_voorstel_antwoord` = 'geseed' WHERE `ftp_voorstel_antwoord` IS NULL;