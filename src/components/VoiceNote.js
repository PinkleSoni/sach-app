import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Btn } from './ui';
import Icon from './Icon';
import { colors, fonts } from '../theme';

export const formatSeconds = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

// Play back a recorded voice note. Optional onRemove shows a remove button.
export default function VoiceNote({ uri, seconds, onRemove }) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  const toggle = () => {
    if (status.playing) return player.pause();
    if (status.didJustFinish) player.seekTo(0);
    player.play();
  };
  return (
    <View style={s.row}>
      <Btn label={status.playing ? 'Pause voice note' : 'Play voice note'} onPress={toggle} style={s.play}>
        <Icon name={status.playing ? 'pause' : 'play'} size={18} color={colors.paper} fill={status.playing ? 'none' : colors.paper} />
      </Btn>
      <View style={{ flex: 1 }}>
        <Text style={s.title}>Voice note</Text>
        <Text style={s.time}>{formatSeconds(seconds || status.duration || 0)}</Text>
      </View>
      {onRemove && (
        <Btn label="Remove voice note" onPress={onRemove} style={s.remove}>
          <Icon name="x" size={18} color={colors.forest} />
        </Btn>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  play: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.bold, fontSize: 14, color: colors.forest },
  time: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  remove: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
