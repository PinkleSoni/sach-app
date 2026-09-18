import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useIsFocused } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { useApp } from '../context/AppContext';
import { getProduct } from '../lib/catalog';
import { Btn } from '../components/ui';
import Icon, { SmileIcon } from '../components/Icon';
import VoiceNote from '../components/VoiceNote';
import { colors, fonts } from '../theme';

const VERDICTS = [
  { label: 'Loved it', kind: 'happy', rating: 5 },
  { label: 'Mixed', kind: 'meh', rating: 3 },
  { label: 'Didn’t suit me', kind: 'sad', rating: 2 },
];
const TAGS = ['Non-greasy', 'Strong smell', 'Broke me out', 'Worth the price', 'Lasts long', 'Good in humidity'];
const MAX_PHOTOS = 4;

export default function ReviewScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const { profile, addReview } = useApp();
  const product = getProduct(route.params.productId);
  const [verdict, setVerdict] = useState(null);
  const [tags, setTags] = useState({});
  const [photos, setPhotos] = useState([]);
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);
  const [voice, setVoice] = useState(null); // { uri, seconds }
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const rec = useAudioRecorderState(recorder);

  const anyTag = Object.values(tags).some(Boolean);
  const step = sent ? 3 : verdict && anyTag ? 2 : 1;
  const touch = (fn) => (...a) => { setSent(false); fn(...a); };

  const addFromCamera = async () => {
    if (photos.length >= MAX_PHOTOS) return;
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return Alert.alert('Camera is off', 'Allow camera access in Settings to take a photo, or pick one from your gallery.');
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!res.canceled && res.assets?.[0]) setPhotos((p) => [...p, res.assets[0].uri].slice(0, MAX_PHOTOS));
  };
  const addFromGallery = async () => {
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) return;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsMultipleSelection: true, selectionLimit: room });
    if (!res.canceled) setPhotos((p) => [...p, ...res.assets.map((a) => a.uri)].slice(0, MAX_PHOTOS));
  };

  const toggleRecord = async () => {
    setSent(false);
    try {
      if (rec.isRecording) {
        const seconds = Math.max(1, Math.round(rec.durationMillis / 1000));
        await recorder.stop();
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
        if (recorder.uri) setVoice({ uri: recorder.uri, seconds });
        return;
      }
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) return Alert.alert('Microphone is off', 'Allow microphone access in Settings to record a voice note, or type a line instead.');
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch {
      Alert.alert('Could not record', 'Something went wrong with the microphone. Try again, or type a line instead.');
    }
  };

  const post = () => {
    const v = VERDICTS.find((x) => x.label === verdict);
    addReview({
      id: 'm' + Date.now(),
      productId: product.id,
      rating: v.rating,
      name: 'You',
      traits: Object.keys(profile || {}).filter((k) => profile[k]),
      duration: 'Just now',
      tags: TAGS.filter((t) => tags[t]),
      text: note.trim(),
      photos,
      voice,
      mine: true,
    });
    setSent(true);
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {focused && <StatusBar style="light" />}
      <View style={[s.header, { paddingTop: insets.top + 6 }]}>
        <Btn label="Back" onPress={() => navigation.goBack()} style={s.headBtn}><Icon name="back" color={colors.cream} /></Btn>
        <View style={s.thumb} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={s.headTitle} numberOfLines={1}>{product.name}</Text>
          <Text style={s.headSub}>Your review · {sent ? 'posted' : `tap ${step} of 3`}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 4, paddingRight: 8 }} accessibilityElementsHidden>
          {[1, 2, 3].map((n) => <View key={n} style={[s.dot, { backgroundColor: n <= step ? colors.amber : '#3A4C41' }]} />)}
        </View>
      </View>

      <ScrollView contentContainerStyle={s.chat} keyboardShouldPersistTaps="handled">
        <Bubble>You checked this earlier. Did it suit you?</Bubble>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {VERDICTS.map((v) => {
            const on = verdict === v.label;
            return (
              <Btn key={v.label} label={v.label} selected={on} onPress={touch(() => setVerdict(v.label))} style={[s.verdict, on ? s.verdictOn : s.verdictOff]}>
                <SmileIcon kind={v.kind} color={on ? colors.cream : colors.forest} />
                <Text style={[s.verdictText, { color: on ? colors.cream : colors.forest }]}>{v.label}</Text>
              </Btn>
            );
          })}
        </View>

        <Bubble>What should people like you know?</Bubble>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {TAGS.map((t) => (
            <Btn key={t} label={t} selected={!!tags[t]} onPress={touch(() => setTags((p) => ({ ...p, [t]: !p[t] })))} style={[s.tag, tags[t] ? s.tagOn : s.tagOff]}>
              <Text style={[s.tagText, { color: tags[t] ? colors.paper : colors.forest }]}>{t}</Text>
            </Btn>
          ))}
        </View>

        <View style={[s.bubble, { width: 290, gap: 10, padding: 12 }]}>
          <Text style={s.bubbleText}>Add a photo. Daylight, on your skin, works best.</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Btn label="Take a photo now" onPress={touch(addFromCamera)} style={[s.photoBtn, { backgroundColor: colors.green }]}>
              <Icon name="camera" size={18} color={colors.paper} /><Text style={[s.photoBtnText, { color: colors.paper }]}>Take now</Text>
            </Btn>
            <Btn label="Pick from gallery" onPress={touch(addFromGallery)} style={[s.photoBtn, { borderWidth: 1.5, borderColor: colors.sandDark, backgroundColor: colors.paper }]}>
              <Icon name="gallery" size={18} color={colors.forest} /><Text style={[s.photoBtnText, { color: colors.forest }]}>Gallery</Text>
            </Btn>
          </View>
          {photos.length > 0 && (
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {photos.map((uri) => (
                <Btn key={uri} label="Remove photo" onPress={() => setPhotos((p) => p.filter((x) => x !== uri))}>
                  <Image source={{ uri }} style={s.photo} />
                </Btn>
              ))}
            </View>
          )}
        </View>

        {(voice || rec.isRecording) && (
          <View style={[s.bubble, { width: 290, padding: 12, backgroundColor: colors.paper }]}>
            {rec.isRecording ? (
              <Text style={s.bubbleText}>Recording… {Math.round(rec.durationMillis / 1000)}s. Tap the mic to stop.</Text>
            ) : (
              <VoiceNote uri={voice.uri} seconds={voice.seconds} onRemove={() => { setVoice(null); setSent(false); }} />
            )}
          </View>
        )}

        {sent && (
          <View style={[s.bubble, { backgroundColor: colors.greenTint, maxWidth: 290 }]}>
            <Text style={s.bubbleText}><Text style={{ fontFamily: fonts.bold }}>Posted. Thank you.</Text> People with your skin who check this product will see your review first.</Text>
          </View>
        )}
      </ScrollView>

      <View style={[s.composer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TextInput
          value={note}
          onChangeText={touch(setNote)}
          placeholder="Add a line, Hindi or English…"
          placeholderTextColor={colors.muted}
          accessibilityLabel="Add a line in any language"
          multiline
          style={s.input}
        />
        <Btn label={rec.isRecording ? 'Stop recording' : 'Record a voice note'} selected={rec.isRecording} onPress={toggleRecord} style={[s.mic, rec.isRecording && { backgroundColor: colors.coralDeep, borderColor: colors.coralDeep }]}>
          <Icon name="mic" size={20} color={rec.isRecording ? colors.paper : colors.forest} />
        </Btn>
        {sent ? (
          <Btn label="Done" onPress={() => navigation.goBack()} style={[s.post, { backgroundColor: colors.green }]}><Text style={[s.postText, { color: colors.paper }]}>Done</Text></Btn>
        ) : (
          <Btn label="Post review" disabled={!verdict} onPress={post} style={[s.post, !verdict && { opacity: 0.4 }]}><Text style={s.postText}>Post</Text></Btn>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const Bubble = ({ children }) => (
  <View style={[s.bubble, { maxWidth: 290 }]}><Text style={s.bubbleText}>{children}</Text></View>
);

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.creamDeep },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingBottom: 12, backgroundColor: colors.forest },
  headBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  thumb: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#3A4C41' },
  headTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.cream },
  headSub: { fontFamily: fonts.regular, fontSize: 13, color: colors.cream, opacity: 0.8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  chat: { gap: 12, padding: 14, paddingBottom: 24 },
  bubble: { alignSelf: 'flex-start', paddingVertical: 11, paddingHorizontal: 14, borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomRightRadius: 18, borderBottomLeftRadius: 6, backgroundColor: colors.paper },
  bubbleText: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.forest },
  verdict: { flex: 1, minHeight: 84, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5 },
  verdictOn: { borderColor: colors.forest, backgroundColor: colors.forest },
  verdictOff: { borderColor: colors.sandDark, backgroundColor: colors.paper },
  verdictText: { fontFamily: fonts.bold, fontSize: 13, textAlign: 'center' },
  tag: { minHeight: 44, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1.5, justifyContent: 'center' },
  tagOn: { borderColor: colors.green, backgroundColor: colors.green },
  tagOff: { borderColor: colors.sandDark, backgroundColor: colors.paper },
  tagText: { fontFamily: fonts.semibold, fontSize: 14 },
  photoBtn: { flex: 1, minHeight: 44, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  photoBtnText: { fontFamily: fonts.bold, fontSize: 14 },
  photo: { width: 60, height: 60, borderRadius: 10, backgroundColor: colors.sand },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 12, paddingTop: 10, backgroundColor: colors.paper, borderTopWidth: 1, borderTopColor: colors.line },
  input: { flex: 1, minHeight: 46, maxHeight: 110, borderRadius: 23, borderWidth: 1.5, borderColor: colors.sandDark, backgroundColor: colors.cream, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, fontFamily: fonts.regular, fontSize: 15, color: colors.forest },
  mic: { width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, borderColor: colors.sandDark, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' },
  post: { height: 46, paddingHorizontal: 20, borderRadius: 23, backgroundColor: colors.amber, justifyContent: 'center' },
  postText: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.forest },
});
