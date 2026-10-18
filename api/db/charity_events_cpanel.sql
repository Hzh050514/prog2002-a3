-- ===========================================================================
--  PROG2002 - Web Development II  |  Assessment 3
--  Database: charity events (crowdfunding) case study
-- ---------------------------------------------------------------------------
--  This file is the complete export of the schema AND the data.
--  Import it with:
--      mysql -u <user> -p < charity_events.sql
--  ...or through phpMyAdmin (Import) on the SCU cPanel.
--
--  Design notes
--  ------------
--  * categories  -> lookup table, one row per event category.
--  * events      -> the charity events themselves. `latitude` / `longitude`
--                   were ADDED in A3 so the external Open-Meteo weather API
--                   can return a forecast for the event location.
--  * registrations -> NEW TABLE in A3. Records who registered for which event.
--                   FOREIGN KEY (event_id) REFERENCES events(event_id).
--                   UNIQUE (event_id, email) enforces the rule:
--                     "one user may register for multiple events, but can
--                      only register for an event once".
-- ===========================================================================



-- ---------------------------------------------------------------------------
-- Look-up table: event categories
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS `registrations`;
DROP TABLE IF EXISTS `events`;
DROP TABLE IF EXISTS `categories`;

CREATE TABLE `categories` (
  `category_id`   INT AUTO_INCREMENT PRIMARY KEY,
  `name`          VARCHAR(100) NOT NULL UNIQUE,
  `description`   VARCHAR(255) NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- ---------------------------------------------------------------------------
-- Core table: the charity events
-- ---------------------------------------------------------------------------
CREATE TABLE `events` (
  `event_id`         INT AUTO_INCREMENT PRIMARY KEY,
  `event_name`       VARCHAR(150)  NOT NULL,
  `event_description` TEXT         NULL,
  `event_date`       DATE          NOT NULL,
  `event_location`   VARCHAR(150)  NOT NULL,

  -- Added in Assessment 3: required by the external Open-Meteo weather API.
  `latitude`         DECIMAL(9,6)  NULL,
  `longitude`        DECIMAL(9,6)  NULL,

  `organiser_name`   VARCHAR(120)  NOT NULL,
  `contact_email`    VARCHAR(120)  NULL,
  `contact_phone`    VARCHAR(40)   NULL,

  `category_id`      INT           NOT NULL,

  -- Allowed life-cycle values used by the client search page and the admin list.
  `status`           ENUM('Active','Past','Suspended') NOT NULL DEFAULT 'Active',

  `target_funding`   DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `current_funding`  DECIMAL(12,2) NOT NULL DEFAULT 0.00,

  CONSTRAINT `fk_events_category`
    FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- ---------------------------------------------------------------------------
-- NEW in Assessment 3: event registrations
-- ---------------------------------------------------------------------------
CREATE TABLE `registrations` (
  `registration_id`    INT AUTO_INCREMENT PRIMARY KEY,

  -- relationship: which event was registered for
  `event_id`           INT           NOT NULL,

  -- user details
  `name`               VARCHAR(120)  NOT NULL,
  `email`              VARCHAR(150)  NOT NULL,
  `phone`              VARCHAR(40)   NULL,

  -- how many tickets were purchased
  `number_of_tickets`  INT           NOT NULL DEFAULT 1,

  -- date of registration
  `registration_date`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT `fk_registrations_event`
    FOREIGN KEY (`event_id`) REFERENCES `events` (`event_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,

  -- A person may register for many events, but only ONCE per event.
  CONSTRAINT `uq_registration_event_email` UNIQUE (`event_id`, `email`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- Helpful index: the event detail page always lists registrations
-- for one event ordered by the most recent purchase first.
CREATE INDEX `idx_registrations_event_date`
  ON `registrations` (`event_id`, `registration_date` DESC);

-- ===========================================================================
--  INITIAL DATA
-- ===========================================================================

INSERT INTO `categories` (`category_id`, `name`, `description`) VALUES
  (1, 'Education',        'Fundraising for schools, literacy and training programs'),
  (2, 'Health & Medical', 'Medical research, hospitals and patient support'),
  (3, 'Environment',      'Conservation, clean-ups and sustainability projects'),
  (4, 'Animal Welfare',   'Shelters, adoption and wildlife protection'),
  (5, 'Community',        'Local community support, food and housing programs'),
  (6, 'Disaster Relief',  'Emergency response for floods, fires and storms'),
  (7, 'Sport',            'Charity sport and recreation events');

-- ---------------------------------------------------------------------------
-- 13 charity events (latitude / longitude included for the weather API)
-- ---------------------------------------------------------------------------
INSERT INTO `events`
  (`event_id`,`event_name`,`event_description`,`event_date`,`event_location`,
   `latitude`,`longitude`,`organiser_name`,`contact_email`,`contact_phone`,
   `category_id`,`status`,`target_funding`,`current_funding`) VALUES
  (1,'Run for Literacy Fun Run',
      'A community fun run raising funds for children literacy programs across NSW.',
      '2026-11-14','Sydney, NSW', -33.868820, 151.209300,
      'Read Australia','events@readaustralia.org.au','+61 2 9000 1111',
      1,'Active',50000.00,31250.00),

  (2,'Cancer Research Gala Dinner',
      'An annual gala dinner funding translational cancer research at metropolitan hospitals.',
      '2026-10-30','Melbourne, VIC', -37.813600, 144.963100,
      'Hope Research Foundation','gala@hopefoundation.org.au','+61 3 9000 2222',
      2,'Active',120000.00,98750.00),

  (3,'Reef Clean-Up Day',
      'Volunteer diving and beach clean-up protecting coral reef ecosystems.',
      '2026-12-05','Cairns, QLD', -16.918600, 145.778100,
      'Reef Guardians','hello@reefguardians.org','+61 7 4000 3333',
      3,'Active',30000.00,12400.00),

  (4,'Rescue Paws Adoption Day',
      'Meet rescued dogs and cats looking for a forever home. Entry by donation.',
      '2026-11-01','Brisbane, QLD', -27.469800, 153.025100,
      'Rescue Paws Queensland','adopt@rescuepawsqld.org.au','+61 7 3000 4444',
      4,'Active',15000.00,14200.00),

  (5,'Winter Warmth Blanket Drive',
      'Collecting blankets and winter clothing for people experiencing homelessness.',
      '2026-07-18','Hobart, TAS', -42.882100, 147.327200,
      'Tasmanian Community Care','info@tascommunitycare.org.au','+61 3 6200 5555',
      5,'Active',20000.00,18750.00),

  (6,'Bushfire Recovery Appeal',
      'Rebuilding grants for families and small businesses affected by summer bushfires.',
      '2026-09-12','Adelaide, SA', -34.928500, 138.600700,
      'National Relief Fund','appeal@nationalrelief.org.au','+61 8 8000 6666',
      6,'Active',250000.00,198400.00),

  (7,'Kids Coding Workshop',
      'Free weekend coding workshops for primary school students in low-income areas.',
      '2026-11-21','Perth, WA', -31.950500, 115.860500,
      'Code4Kids WA','workshops@code4kidswa.org.au','+61 8 9000 7777',
      1,'Active',18000.00,6250.00),

  (8,'Mental Health Awareness Walk',
      'A 10 km awareness walk supporting free counselling services nationwide.',
      '2026-10-10','Canberra, ACT', -35.280900, 149.130000,
      'Minds Together','walk@mindstogether.org.au','+61 2 6100 8888',
      2,'Active',45000.00,41000.00),

  (9,'Urban Tree Planting Day',
      'Planting 5,000 native trees across suburban parks to expand green cover.',
      '2026-08-22','Newcastle, NSW', -32.928300, 151.781700,
      'Green City Collective','plant@greencitycollective.org.au','+61 2 4900 9999',
      3,'Suspended',22000.00,4100.00),

  (10,'Guide Dog Puppy Training Open Day',
      'See guide dog puppies in training and support the breeding program.',
      '2026-12-12','Gold Coast, QLD', -28.016700, 153.400000,
      'Guide Dogs Queensland','events@guidedogsqld.com.au','+61 7 5500 1212',
      4,'Active',35000.00,26900.00),

  (11,'Community Soup Kitchen',
      'Nightly meals for people in need, run entirely by volunteers.',
      '2026-05-09','Darwin, NT', -12.463400, 130.845600,
      'Darwin Community Kitchen','kitchen@darwincommunity.org.au','+61 8 8900 1313',
      5,'Past',12000.00,12000.00),

  (12,'Flood Relief Benefit Concert',
      'A benefit concert raising emergency funds for northern rivers flood recovery.',
      '2026-04-25','Lismore, NSW', -28.810000, 153.284500,
      'Northern Rivers Relief','concert@nrrelief.org.au','+61 2 6600 1414',
      6,'Past',80000.00,76300.00),

  (13,'Charity Cricket Match',
      'Local celebrities versus community heroes in a Twenty20 charity match.',
      '2026-11-28','Geelong, VIC', -38.149900, 144.361700,
      'Geelong Community Sport','cricket@geelongcommunitysport.org.au','+61 3 5200 1515',
      7,'Active',26000.00,7900.00);

-- ---------------------------------------------------------------------------
-- 14 registrations (>= 10 required) spread across several events.
-- `registration_date` values differ so the client "latest first" sorting and
-- the admin "associated registrations" view are easy to verify.
-- ---------------------------------------------------------------------------
INSERT INTO `registrations`
  (`registration_id`,`event_id`,`name`,`email`,`phone`,`number_of_tickets`,`registration_date`) VALUES
  (1, 1, 'Nehemia Sugianto', 'nehemia.sugianto@example.com', '+61 400 111 222', 2, '2026-09-02 09:15:00'),
  (2, 1, 'Amelia Hart',      'amelia.hart@example.com',      '+61 400 111 333', 4, '2026-09-05 14:42:00'),
  (3, 1, 'Daniel Osei',      'daniel.osei@example.com',      '+61 400 111 444', 1, '2026-09-11 19:05:00'),
  (4, 2, 'Priya Raman',      'priya.raman@example.com',      '+61 400 222 111', 2, '2026-09-15 11:30:00'),
  (5, 2, 'Nehemia Sugianto', 'nehemia.sugianto@example.com', '+61 400 111 222', 1, '2026-09-18 08:25:00'),
  (6, 3, 'Lucas Meyer',      'lucas.meyer@example.com',      '+61 400 333 222', 6, '2026-09-20 16:00:00'),
  (7, 4, 'Chloe Bennett',    'chloe.bennett@example.com',    '+61 400 444 333', 3, '2026-09-22 10:10:00'),
  (8, 5, 'Amelia Hart',      'amelia.hart@example.com',      '+61 400 111 333', 2, '2026-09-24 13:45:00'),
  (9, 6, 'Daniel Osei',      'daniel.osei@example.com',      '+61 400 111 444', 5, '2026-09-27 20:20:00'),
  (10,7, 'Mei Lin',          'mei.lin@example.com',          '+61 400 555 666', 2, '2026-09-29 09:00:00'),
  (11,8, 'Priya Raman',      'priya.raman@example.com',      '+61 400 222 111', 4, '2026-10-01 07:35:00'),
  (12,10,'Lucas Meyer',      'lucas.meyer@example.com',      '+61 400 333 222', 2, '2026-10-03 15:50:00'),
  (13,11,'Chloe Bennett',    'chloe.bennett@example.com',    '+61 400 444 333', 1, '2026-04-20 12:00:00'),
  (14,12,'Mei Lin',          'mei.lin@example.com',          '+61 400 555 666', 3, '2026-04-01 18:30:00');

-- ===========================================================================
--  End of export
-- ===========================================================================
