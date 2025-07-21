import test from 'ava';
import { MusicPlayerService } from './musicPlayer.js';

test.beforeEach(t => {
    t.context.player = new MusicPlayerService();
});

test('setVolume should set the volume correctly', t => {
    const player = t.context.player;
    player.setVolume(0.5);
    t.is(player.getVolume(), 0.5);
});

test('increaseVolume should increase the volume', t => {
    const player = t.context.player;
    player.setVolume(0.5);
    player.increaseVolume(0.2);
    t.is(player.getVolume(), 0.7);
});

test('decreaseVolume should decrease the volume', t => {
    const player = t.context.player;
    player.setVolume(0.5);
    player.decreaseVolume(0.3);
    t.is(player.getVolume(), 0.2);
});

test('volume should not exceed 1', t => {
    const player = t.context.player;
    player.setVolume(0.9);
    player.increaseVolume(0.3);
    t.is(player.getVolume(), 1);
});

test('volume should not go below 0', t => {
    const player = t.context.player;
    player.setVolume(0.1);
    player.decreaseVolume(0.2);
    t.is(player.getVolume(), 0);
});
