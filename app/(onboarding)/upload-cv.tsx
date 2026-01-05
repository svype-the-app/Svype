import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

export default function UploadCVScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleUpload = () => {
    // TODO: Implement file picker and upload logic
    console.log('Upload CV');
    router.push('/(jobseeker)/swipe' as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Card>
          <CardContent style={styles.cardContent}>
            <Text style={[styles.title, { color: colors.cardForeground }]}>
              Upload Your Resume
            </Text>
            <Text style={[styles.description, { color: colors.mutedForeground }]}>
              Our AI will extract your information and build your profile automatically
            </Text>

            <TouchableOpacity
              style={[styles.uploadArea, { borderColor: colors.border, backgroundColor: colors.muted }]}
              onPress={handleUpload}
            >
              <Ionicons name="cloud-upload-outline" size={48} color={colors.mutedForeground} />
              <Text style={[styles.uploadText, { color: colors.foreground }]}>
                Tap to upload CV
              </Text>
              <Text style={[styles.uploadSubtext, { color: colors.mutedForeground }]}>
                PDF, DOCX (Max 5MB)
              </Text>
            </TouchableOpacity>

            <Button onPress={handleUpload} style={styles.button}>
              Continue
            </Button>

            <Button variant="outline" onPress={() => router.push('/(jobseeker)/swipe' as any)}>
              Skip
            </Button>
          </CardContent>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  cardContent: {
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    gap: 8,
    marginVertical: 16,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
  },
  uploadSubtext: {
    fontSize: 12,
  },
  button: {
    width: '100%',
  },
});
