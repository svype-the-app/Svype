import { useState } from 'react'
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Colors } from '@/constants/theme'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getCompanyJobs } from '@/lib/mock-data'

export default function EditJobScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams()
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']

  const jobs = getCompanyJobs()
  const job = jobs.find(j => j.id === Number(id))

  const [title, setTitle] = useState(job?.title || '')
  const [applicants, setApplicants] = useState(job?.applicants.toString() || '')
  const [status, setStatus] = useState(job?.status || 'active')

  const handleSave = () => {
    // Update logic would go here
    router.back()
  }

  if (!job) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Edit Job</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.mutedForeground }]}>Job not found</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Edit Job</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Form */}
        <View style={styles.content}>
          <Card>
            <CardContent style={styles.cardContent}>
              {/* Job Title */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.foreground }]}>Job Title</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: colors.border,
                      color: colors.foreground,
                      backgroundColor: colors.background,
                    },
                  ]}
                  placeholder="Enter job title"
                  placeholderTextColor={colors.mutedForeground}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              {/* Applicants */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.foreground }]}>Applicants</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: colors.border,
                      color: colors.foreground,
                      backgroundColor: colors.background,
                    },
                  ]}
                  placeholder="Enter number of applicants"
                  placeholderTextColor={colors.mutedForeground}
                  value={applicants}
                  onChangeText={setApplicants}
                  keyboardType="numeric"
                />
              </View>

              {/* Status */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.foreground }]}>Status</Text>
                <View style={styles.statusContainer}>
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      {
                        backgroundColor: status === 'active' ? colors.primary : colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => setStatus('active')}
                  >
                    <Text
                      style={[
                        styles.statusButtonText,
                        { color: status === 'active' ? '#fff' : colors.foreground },
                      ]}
                    >
                      Active
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      {
                        backgroundColor: status === 'closed' ? '#ef4444' : colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => setStatus('closed')}
                  >
                    <Text
                      style={[
                        styles.statusButtonText,
                        { color: status === 'closed' ? '#fff' : colors.foreground },
                      ]}
                    >
                      Closed
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Save Button */}
              <Button onPress={handleSave} style={styles.saveButton}>
                <Ionicons name="save" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </Button>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  cardContent: {
    gap: 16,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
  },
})
