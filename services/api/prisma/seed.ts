/// <reference types="node" />

import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/utils/hash'

const prisma = new PrismaClient()

async function main() {
	console.log('🌱 Iniciando seed...')

	const nowTimestamp = Math.floor(Date.now() / 1000)

	await prisma.users.upsert({
		where: { id: 1 },
		update: {},
		create: {
			id: 1,
			name: 'Fubika',
			safe_name: 'fubika',
			email: 'bot@fubika.com.br',
			priv: 1,
			country: 'BR',
			pw_bcrypt: 'placeholder_hash',
			creation_time: nowTimestamp,
			latest_activity: nowTimestamp,
		},
	})

	const modes = [0, 1, 2, 3, 4, 5, 6, 8]
	for (const mode of modes) {
		await prisma.stats.upsert({
			where: { id_mode: { id: 1, mode: mode } },
			update: {},
			create: { id: 1, mode: mode, tscore: 0, rscore: 0 }
		})
	}

	const fName = process.env.FIRST_USER_NAME
	const fEmail = process.env.FIRST_USER_EMAIL
	const fRawPass = process.env.FIRST_USER_PASS

	if (!fName || !fEmail || !fRawPass) {
		throw new Error('Variáveis faltando valor: FIRST_USER_NAME, FIRST_USER_EMAIL, FIRST_USER_PASS')
	}

	const safeName = fName.toLowerCase().replace(/ /g, '_');
	const hash = await hashPassword(fRawPass)

	await prisma.users.upsert({
		where: { id: 3 },
		update: {},
		create: {
			id: 3,
			name: fName,
			safe_name: safeName,
			email: fEmail,
			priv: 1048575,
			country: 'BR',
			pw_bcrypt: hash,
			creation_time: nowTimestamp,
			latest_activity: nowTimestamp,
			is_admin: true,
			is_dev: true,
		},
	})

	for (const mode of modes) {
		await prisma.stats.upsert({
			where: { id_mode: { id: 3, mode: mode } },
			update: {},
			create: { id: 3, mode: mode, tscore: 0, rscore: 0 }
		})
	}

	const channels = [
		{ name: '#osu', topic: 'General discussion.', read_priv: 1, write_priv: 1, auto_join: true },
		{ name: '#announce', topic: 'Exemplary performance.', read_priv: 1, write_priv: 24576, auto_join: true },
		{ name: '#lobby', topic: 'Multiplayer lobby.', read_priv: 1, write_priv: 1, auto_join: false },
		{ name: '#supporter', topic: 'General discussion for supporters.', read_priv: 48, write_priv: 48, auto_join: false },
		{ name: '#staff', topic: 'General discussion for staff.', read_priv: 28672, write_priv: 28672, auto_join: true },
		{ name: '#admin', topic: 'General discussion for administrators.', read_priv: 24576, write_priv: 24576, auto_join: true },
		{ name: '#dev', topic: 'General discussion for developers.', read_priv: 16384, write_priv: 16384, auto_join: true },
	]

	for (const c of channels) {
		await prisma.channels.upsert({
			where: { name: c.name },
			update: { topic: c.topic, write_priv: c.write_priv },
			create: c,
		})
	}

	const achievements = [
		{ id: 1, file: 'osu-skill-pass-1', name: 'Rising Star', desc: "Can't go forward without the first steps.", cond: '(score.mods & 1 == 0) and 1 <= score.sr < 2 and mode_vn == 0' },
		{ id: 2, file: 'osu-skill-pass-2', name: 'Constellation Prize', desc: "Definitely not a consolation prize. Now things start getting hard!", cond: '(score.mods & 1 == 0) and 2 <= score.sr < 3 and mode_vn == 0' },
		{ id: 3, file: 'osu-skill-pass-3', name: 'Building Confidence', desc: "Oh, you've SO got this.", cond: '(score.mods & 1 == 0) and 3 <= score.sr < 4 and mode_vn == 0' },
		{ id: 4, file: 'osu-skill-pass-4', name: 'Insanity Approaches', desc: "You're not twitching, you're just ready.", cond: '(score.mods & 1 == 0) and 4 <= score.sr < 5 and mode_vn == 0' },
		{ id: 5, file: 'osu-skill-pass-5', name: 'These Clarion Skies', desc: "Everything seems so clear now.", cond: '(score.mods & 1 == 0) and 5 <= score.sr < 6 and mode_vn == 0' },
		{ id: 6, file: 'osu-skill-pass-6', name: 'Above and Beyond', desc: "A cut above the rest.", cond: '(score.mods & 1 == 0) and 6 <= score.sr < 7 and mode_vn == 0' },
		{ id: 7, file: 'osu-skill-pass-7', name: 'Supremacy', desc: "All marvel before your prowess.", cond: '(score.mods & 1 == 0) and 7 <= score.sr < 8 and mode_vn == 0' },
		{ id: 8, file: 'osu-skill-pass-8', name: 'Absolution', desc: "My god, you're full of stars!", cond: '(score.mods & 1 == 0) and 8 <= score.sr < 9 and mode_vn == 0' },
		{ id: 9, file: 'osu-skill-pass-9', name: 'Event Horizon', desc: "No force dares to pull you under.", cond: '(score.mods & 1 == 0) and 9 <= score.sr < 10 and mode_vn == 0' },
		{ id: 10, file: 'osu-skill-pass-10', name: 'Phantasm', desc: "Fevered is your passion, extraordinary is your skill.", cond: '(score.mods & 1 == 0) and 10 <= score.sr < 11 and mode_vn == 0' },
		{ id: 11, file: 'osu-skill-fc-1', name: 'Totality', desc: "All the notes. Every single one.", cond: 'score.perfect and 1 <= score.sr < 2 and mode_vn == 0' },
		{ id: 12, file: 'osu-skill-fc-2', name: 'Business As Usual', desc: "Two to go, please.", cond: 'score.perfect and 2 <= score.sr < 3 and mode_vn == 0' },
		{ id: 13, file: 'osu-skill-fc-3', name: 'Building Steam', desc: "Hey, this isn't so bad.", cond: 'score.perfect and 3 <= score.sr < 4 and mode_vn == 0' },
		{ id: 14, file: 'osu-skill-fc-4', name: 'Moving Forward', desc: "Bet you feel good about that.", cond: 'score.perfect and 4 <= score.sr < 5 and mode_vn == 0' },
		{ id: 15, file: 'osu-skill-fc-5', name: 'Paradigm Shift', desc: "Surprisingly difficult.", cond: 'score.perfect and 5 <= score.sr < 6 and mode_vn == 0' },
		{ id: 16, file: 'osu-skill-fc-6', name: 'Anguish Quelled', desc: "Don't choke.", cond: 'score.perfect and 6 <= score.sr < 7 and mode_vn == 0' },
		{ id: 17, file: 'osu-skill-fc-7', name: 'Never Give Up', desc: "Excellence is its own reward.", cond: 'score.perfect and 7 <= score.sr < 8 and mode_vn == 0' },
		{ id: 18, file: 'osu-skill-fc-8', name: 'Aberration', desc: "They said it couldn't be done. They were wrong.", cond: 'score.perfect and 8 <= score.sr < 9 and mode_vn == 0' },
		{ id: 19, file: 'osu-skill-fc-9', name: 'Chosen', desc: "Reign among the Prometheans, where you belong.", cond: 'score.perfect and 9 <= score.sr < 10 and mode_vn == 0' },
		{ id: 20, file: 'osu-skill-fc-10', name: 'Unfathomable', desc: "You have no equal.", cond: 'score.perfect and 10 <= score.sr < 11 and mode_vn == 0' },
		{ id: 21, file: 'osu-combo-500', name: '500 Combo', desc: "500 big ones! You're moving up in the world!", cond: '500 <= score.max_combo < 750 and mode_vn == 0' },
		{ id: 22, file: 'osu-combo-750', name: '750 Combo', desc: "750 notes back to back? Woah.", cond: '750 <= score.max_combo < 1000 and mode_vn == 0' },
		{ id: 23, file: 'osu-combo-1000', name: '1000 Combo', desc: "A thousand reasons why you rock at this game.", cond: '1000 <= score.max_combo < 2000 and mode_vn == 0' },
		{ id: 24, file: 'osu-combo-2000', name: '2000 Combo', desc: "Nothing can stop you now.", cond: '2000 <= score.max_combo and mode_vn == 0' },
		{ id: 25, file: 'taiko-skill-pass-1', name: 'My First Don', desc: "Marching to the beat of your own drum. Literally.", cond: '(score.mods & 1 == 0) and 1 <= score.sr < 2 and mode_vn == 1' },
		{ id: 26, file: 'taiko-skill-pass-2', name: 'Katsu Katsu Katsu', desc: "Hora! Izuko!", cond: '(score.mods & 1 == 0) and 2 <= score.sr < 3 and mode_vn == 1' },
		{ id: 27, file: 'taiko-skill-pass-3', name: 'Not Even Trying', desc: "Muzukashii? Not even.", cond: '(score.mods & 1 == 0) and 3 <= score.sr < 4 and mode_vn == 1' },
		{ id: 28, file: 'taiko-skill-pass-4', name: 'Face Your Demons', desc: "The first trials are now behind you, but are you a match for the Oni?", cond: '(score.mods & 1 == 0) and 4 <= score.sr < 5 and mode_vn == 1' },
		{ id: 29, file: 'taiko-skill-pass-5', name: 'The Demon Within', desc: "No rest for the wicked.", cond: '(score.mods & 1 == 0) and 5 <= score.sr < 6 and mode_vn == 1' },
		{ id: 30, file: 'taiko-skill-pass-6', name: 'Drumbreaker', desc: "Too strong.", cond: '(score.mods & 1 == 0) and 6 <= score.sr < 7 and mode_vn == 1' },
		{ id: 31, file: 'taiko-skill-pass-7', name: 'The Godfather', desc: "You are the Don of Dons.", cond: '(score.mods & 1 == 0) and 7 <= score.sr < 8 and mode_vn == 1' },
		{ id: 32, file: 'taiko-skill-pass-8', name: 'Rhythm Incarnate', desc: "Feel the beat. Become the beat.", cond: '(score.mods & 1 == 0) and 8 <= score.sr < 9 and mode_vn == 1' },
		{ id: 33, file: 'taiko-skill-fc-1', name: 'Keeping Time', desc: "Don, then katsu. Don, then katsu..", cond: 'score.perfect and 1 <= score.sr < 2 and mode_vn == 1' },
		{ id: 34, file: 'taiko-skill-fc-2', name: 'To Your Own Beat', desc: "Straight and steady.", cond: 'score.perfect and 2 <= score.sr < 3 and mode_vn == 1' },
		{ id: 35, file: 'taiko-skill-fc-3', name: 'Big Drums', desc: "Bigger scores to match.", cond: 'score.perfect and 3 <= score.sr < 4 and mode_vn == 1' },
		{ id: 36, file: 'taiko-skill-fc-4', name: 'Adversity Overcome', desc: "Difficult? Not for you.", cond: 'score.perfect and 4 <= score.sr < 5 and mode_vn == 1' },
		{ id: 37, file: 'taiko-skill-fc-5', name: 'Demonslayer', desc: "An Oni felled forevermore.", cond: 'score.perfect and 5 <= score.sr < 6 and mode_vn == 1' },
		{ id: 38, file: 'taiko-skill-fc-6', name: 'Rhythm\'s Call', desc: "Heralding true skill.", cond: 'score.perfect and 6 <= score.sr < 7 and mode_vn == 1' },
		{ id: 39, file: 'taiko-skill-fc-7', name: 'Time Everlasting', desc: "Not a single beat escapes you.", cond: 'score.perfect and 7 <= score.sr < 8 and mode_vn == 1' },
		{ id: 40, file: 'taiko-skill-fc-8', name: 'The Drummer\'s Throne', desc: "Percussive brilliance befitting royalty alone.", cond: 'score.perfect and 8 <= score.sr < 9 and mode_vn == 1' },
		{ id: 41, file: 'fruits-skill-pass-1', name: 'A Slice Of Life', desc: "Hey, this fruit catching business isn't bad.", cond: '(score.mods & 1 == 0) and 1 <= score.sr < 2 and mode_vn == 2' },
		{ id: 42, file: 'fruits-skill-pass-2', name: 'Dashing Ever Forward', desc: "Fast is how you do it.", cond: '(score.mods & 1 == 0) and 2 <= score.sr < 3 and mode_vn == 2' },
		{ id: 43, file: 'fruits-skill-pass-3', name: 'Zesty Disposition', desc: "No scurvy for you, not with that much fruit.", cond: '(score.mods & 1 == 0) and 3 <= score.sr < 4 and mode_vn == 2' },
		{ id: 44, file: 'fruits-skill-pass-4', name: 'Hyperdash ON!', desc: "Time and distance is no obstacle to you.", cond: '(score.mods & 1 == 0) and 4 <= score.sr < 5 and mode_vn == 2' },
		{ id: 45, file: 'fruits-skill-pass-5', name: 'It\'s Raining Fruit', desc: "And you can catch them all.", cond: '(score.mods & 1 == 0) and 5 <= score.sr < 6 and mode_vn == 2' },
		{ id: 46, file: 'fruits-skill-pass-6', name: 'Fruit Ninja', desc: "Legendary techniques.", cond: '(score.mods & 1 == 0) and 6 <= score.sr < 7 and mode_vn == 2' },
		{ id: 47, file: 'fruits-skill-pass-7', name: 'Dreamcatcher', desc: "No fruit, only dreams now.", cond: '(score.mods & 1 == 0) and 7 <= score.sr < 8 and mode_vn == 2' },
		{ id: 48, file: 'fruits-skill-pass-8', name: 'Lord of the Catch', desc: "Your kingdom kneels before you.", cond: '(score.mods & 1 == 0) and 8 <= score.sr < 9 and mode_vn == 2' },
		{ id: 49, file: 'fruits-skill-fc-1', name: 'Sweet And Sour', desc: "Apples and oranges, literally.", cond: 'score.perfect and 1 <= score.sr < 2 and mode_vn == 2' },
		{ id: 50, file: 'fruits-skill-fc-2', name: 'Reaching The Core', desc: "The seeds of future success.", cond: 'score.perfect and 2 <= score.sr < 3 and mode_vn == 2' },
		{ id: 51, file: 'fruits-skill-fc-3', name: 'Clean Platter', desc: "Clean only of failure. It is completely full, otherwise.", cond: 'score.perfect and 3 <= score.sr < 4 and mode_vn == 2' },
		{ id: 52, file: 'fruits-skill-fc-4', name: 'Between The Rain', desc: "No umbrella needed.", cond: 'score.perfect and 4 <= score.sr < 5 and mode_vn == 2' },
		{ id: 53, file: 'fruits-skill-fc-5', name: 'Addicted', desc: "That was an overdose?", cond: 'score.perfect and 5 <= score.sr < 6 and mode_vn == 2' },
		{ id: 54, file: 'fruits-skill-fc-6', name: 'Quickening', desc: "A dash above normal limits.", cond: 'score.perfect and 6 <= score.sr < 7 and mode_vn == 2' },
		{ id: 55, file: 'fruits-skill-fc-7', name: 'Supersonic', desc: "Faster than is reasonably necessary.", cond: 'score.perfect and 7 <= score.sr < 8 and mode_vn == 2' },
		{ id: 56, file: 'fruits-skill-fc-8', name: 'Dashing Scarlet', desc: "Speed beyond mortal reckoning.", cond: 'score.perfect and 8 <= score.sr < 9 and mode_vn == 2' },
		{ id: 57, file: 'mania-skill-pass-1', name: 'First Steps', desc: "It isn't 9-to-5, but 1-to-9. Keys, that is.", cond: '(score.mods & 1 == 0) and 1 <= score.sr < 2 and mode_vn == 3' },
		{ id: 58, file: 'mania-skill-pass-2', name: 'No Normal Player', desc: "Not anymore, at least.", cond: '(score.mods & 1 == 0) and 2 <= score.sr < 3 and mode_vn == 3' },
		{ id: 59, file: 'mania-skill-pass-3', name: 'Impulse Drive', desc: "Not quite hyperspeed, but getting close.", cond: '(score.mods & 1 == 0) and 3 <= score.sr < 4 and mode_vn == 3' },
		{ id: 60, file: 'mania-skill-pass-4', name: 'Hyperspeed', desc: "Woah.", cond: '(score.mods & 1 == 0) and 4 <= score.sr < 5 and mode_vn == 3' },
		{ id: 61, file: 'mania-skill-pass-5', name: 'Ever Onwards', desc: "Another challenge is just around the corner.", cond: '(score.mods & 1 == 0) and 5 <= score.sr < 6 and mode_vn == 3' },
		{ id: 62, file: 'mania-skill-pass-6', name: 'Another Surpassed', desc: "Is there no limit to your skills?", cond: '(score.mods & 1 == 0) and 6 <= score.sr < 7 and mode_vn == 3' },
		{ id: 63, file: 'mania-skill-pass-7', name: 'Extra Credit', desc: "See me after class.", cond: '(score.mods & 1 == 0) and 7 <= score.sr < 8 and mode_vn == 3' },
		{ id: 64, file: 'mania-skill-pass-8', name: 'Maniac', desc: "There's just no stopping you.", cond: '(score.mods & 1 == 0) and 8 <= score.sr < 9 and mode_vn == 3' },
		{ id: 65, file: 'mania-skill-fc-1', name: 'Keystruck', desc: "The beginning of a new story", cond: 'score.perfect and 1 <= score.sr < 2 and mode_vn == 3' },
		{ id: 66, file: 'mania-skill-fc-2', name: 'Keying In', desc: "Finding your groove.", cond: 'score.perfect and 2 <= score.sr < 3 and mode_vn == 3' },
		{ id: 67, file: 'mania-skill-fc-3', name: 'Hyperflow', desc: "You can *feel* the rhythm.", cond: 'score.perfect and 3 <= score.sr < 4 and mode_vn == 3' },
		{ id: 68, file: 'mania-skill-fc-4', name: 'Breakthrough', desc: "Many skills mastered, rolled into one.", cond: 'score.perfect and 4 <= score.sr < 5 and mode_vn == 3' },
		{ id: 69, file: 'mania-skill-fc-5', name: 'Everything Extra', desc: "Giving your all is giving everything you have.", cond: 'score.perfect and 5 <= score.sr < 6 and mode_vn == 3' },
		{ id: 70, file: 'mania-skill-fc-6', name: 'Level Breaker', desc: "Finesse beyond reason", cond: 'score.perfect and 6 <= score.sr < 7 and mode_vn == 3' },
		{ id: 71, file: 'mania-skill-fc-7', name: 'Step Up', desc: "A precipice rarely seen.", cond: 'score.perfect and 7 <= score.sr < 8 and mode_vn == 3' },
		{ id: 72, file: 'mania-skill-fc-8', name: 'Behind The Veil', desc: "Supernatural!", cond: 'score.perfect and 8 <= score.sr < 9 and mode_vn == 3' },
		{ id: 73, file: 'all-intro-suddendeath', name: 'Finality', desc: 'High stakes, no regrets.', cond: 'score.mods & 32' },
		{ id: 74, file: 'all-intro-hidden', name: 'Blindsight', desc: 'I can see just perfectly', cond: 'score.mods & 8' },
		{ id: 75, file: 'all-intro-perfect', name: 'Perfectionist', desc: 'Accept nothing but the best.', cond: 'score.mods & 16384' },
		{ id: 76, file: 'all-intro-hardrock', name: 'Rock Around The Clock', desc: "You can't stop the rock.", cond: 'score.mods & 16' },
		{ id: 77, file: 'all-intro-doubletime', name: 'Time And A Half', desc: "Having a right ol' time. One and a half of them, almost.", cond: 'score.mods & 64' },
		{ id: 78, file: 'all-intro-flashlight', name: 'Are You Afraid Of The Dark?', desc: "Harder than it looks, probably because it's hard to look.", cond: 'score.mods & 1024' },
		{ id: 79, file: 'all-intro-easy', name: 'Dial It Right Back', desc: 'Sometimes you just want to take it easy.', cond: 'score.mods & 2' },
		{ id: 80, file: 'all-intro-nofail', name: 'Risk Averse', desc: 'Safety nets are fun!', cond: 'score.mods & 1' },
		{ id: 81, file: 'all-intro-nightcore', name: 'Sweet Rave Party', desc: 'Founded in the fine tradition of changing things that were just fine as they were.', cond: 'score.mods & 512' },
		{ id: 82, file: 'all-intro-halftime', name: 'Slowboat', desc: 'You got there. Eventually.', cond: 'score.mods & 256' },
		{ id: 83, file: 'all-intro-spunout', name: 'Burned Out', desc: 'One cannot always spin to win.', cond: 'score.mods & 4096' },
	]

	for (const ach of achievements) {
		await prisma.achievements.upsert({
			where: { id: ach.id },
			update: { cond: ach.cond, desc: ach.desc, name: ach.name, file: ach.file },
			create: ach,
		})
	}
	console.log(`✅ ${achievements.length} medalhas processadas.`)
}

main()
	.catch((e) => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})