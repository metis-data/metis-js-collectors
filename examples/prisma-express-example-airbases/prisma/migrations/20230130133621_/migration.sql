-- CreateTable
CREATE TABLE "account" (
    "account_id" SERIAL NOT NULL,
    "login" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "frequent_flyer_id" INTEGER,
    "update_ts" TIMESTAMPTZ(6),

    CONSTRAINT "account_pkey" PRIMARY KEY ("account_id")
);

-- CreateTable
CREATE TABLE "aircraft" (
    "model" TEXT,
    "range" DECIMAL NOT NULL,
    "class" INTEGER NOT NULL,
    "velocity" DECIMAL NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "aircraft_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "airport" (
    "airport_code" CHAR(3) NOT NULL,
    "airport_name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "airport_tz" TEXT NOT NULL,
    "continent" TEXT,
    "iso_country" TEXT,
    "iso_region" TEXT,
    "intnl" BOOLEAN NOT NULL,
    "update_ts" TIMESTAMPTZ(6),

    CONSTRAINT "airport_pkey" PRIMARY KEY ("airport_code")
);

-- CreateTable
CREATE TABLE "boarding_pass" (
    "pass_id" SERIAL NOT NULL,
    "passenger_id" BIGINT,
    "booking_leg_id" BIGINT,
    "seat" TEXT,
    "boarding_time" TIMESTAMPTZ(6),
    "precheck" BOOLEAN,
    "update_ts" TIMESTAMPTZ(6),

    CONSTRAINT "boarding_pass_pkey" PRIMARY KEY ("pass_id")
);

-- CreateTable
CREATE TABLE "boarding_pass_no_indexes" (
    "pass_id" INTEGER,
    "passenger_id" BIGINT,
    "booking_leg_id" BIGINT,
    "seat" TEXT,
    "boarding_time" TIMESTAMPTZ(6),
    "precheck" BOOLEAN,
    "update_ts" TIMESTAMPTZ(6)
);

-- CreateTable
CREATE TABLE "booking" (
    "booking_id" BIGINT NOT NULL,
    "booking_ref" TEXT NOT NULL,
    "booking_name" TEXT,
    "account_id" INTEGER,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "update_ts" TIMESTAMPTZ(6),
    "price" DECIMAL(7,2),

    CONSTRAINT "booking_pkey" PRIMARY KEY ("booking_id")
);

-- CreateTable
CREATE TABLE "booking_leg" (
    "booking_leg_id" BIGSERIAL NOT NULL,
    "booking_id" BIGINT NOT NULL,
    "flight_id" INTEGER NOT NULL,
    "leg_num" INTEGER,
    "is_returning" BOOLEAN,
    "update_ts" TIMESTAMPTZ(6),

    CONSTRAINT "booking_leg_pkey" PRIMARY KEY ("booking_leg_id")
);

-- CreateTable
CREATE TABLE "flight" (
    "flight_id" SERIAL NOT NULL,
    "flight_no" TEXT NOT NULL,
    "scheduled_departure" TIMESTAMPTZ(6) NOT NULL,
    "scheduled_arrival" TIMESTAMPTZ(6) NOT NULL,
    "departure_airport" CHAR(3) NOT NULL,
    "arrival_airport" CHAR(3) NOT NULL,
    "status" TEXT NOT NULL,
    "aircraft_code" CHAR(3) NOT NULL,
    "actual_departure" TIMESTAMPTZ(6),
    "actual_arrival" TIMESTAMPTZ(6),
    "update_ts" TIMESTAMPTZ(6),

    CONSTRAINT "flight_pkey" PRIMARY KEY ("flight_id")
);

-- CreateTable
CREATE TABLE "frequent_flyer" (
    "frequent_flyer_id" SERIAL NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "card_num" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "award_points" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "update_ts" TIMESTAMPTZ(6),

    CONSTRAINT "frequent_flyer_pkey" PRIMARY KEY ("frequent_flyer_id")
);

-- CreateTable
CREATE TABLE "passenger" (
    "passenger_id" BIGSERIAL NOT NULL,
    "booking_id" BIGINT NOT NULL,
    "booking_ref" TEXT,
    "passenger_no" INTEGER,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "account_id" INTEGER,
    "update_ts" TIMESTAMPTZ(6),
    "age" INTEGER,

    CONSTRAINT "passenger_pkey" PRIMARY KEY ("passenger_id")
);

-- CreateTable
CREATE TABLE "phone" (
    "phone_id" SERIAL NOT NULL,
    "account_id" INTEGER,
    "phone" TEXT,
    "phone_type" TEXT,
    "primary_phone" BOOLEAN,
    "update_ts" TIMESTAMPTZ(6),

    CONSTRAINT "phone_pkey" PRIMARY KEY ("phone_id")
);

-- CreateTable
CREATE TABLE "testing" (
    "n" INTEGER,
    "n1" OID
);

-- CreateIndex
CREATE INDEX "bp_boarding_time_idx" ON "boarding_pass"("boarding_time");

-- CreateIndex
CREATE INDEX "idx_passenger_id" ON "boarding_pass"("passenger_id");

-- CreateIndex
CREATE UNIQUE INDEX "booking_booking_ref_key" ON "booking"("booking_ref");

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "frequent_flyer_id_fk" FOREIGN KEY ("frequent_flyer_id") REFERENCES "frequent_flyer"("frequent_flyer_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "boarding_pass" ADD CONSTRAINT "booking_leg_id_fk" FOREIGN KEY ("booking_leg_id") REFERENCES "booking_leg"("booking_leg_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "boarding_pass" ADD CONSTRAINT "passenger_id_fk" FOREIGN KEY ("passenger_id") REFERENCES "passenger"("passenger_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "account"("account_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "booking_leg" ADD CONSTRAINT "booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "booking"("booking_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "booking_leg" ADD CONSTRAINT "flight_id_fk" FOREIGN KEY ("flight_id") REFERENCES "flight"("flight_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "flight" ADD CONSTRAINT "aircraft_code_fk" FOREIGN KEY ("aircraft_code") REFERENCES "aircraft"("code") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "flight" ADD CONSTRAINT "arrival_airport_fk" FOREIGN KEY ("departure_airport") REFERENCES "airport"("airport_code") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "passenger" ADD CONSTRAINT "pass_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "account"("account_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "passenger" ADD CONSTRAINT "pass_booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "booking"("booking_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "phone" ADD CONSTRAINT "phone_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "account"("account_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
