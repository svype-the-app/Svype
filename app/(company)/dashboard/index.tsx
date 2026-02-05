import { useState, useEffect, useRef } from "react"
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Modal,
  Dimensions,
  Image,
  Animated,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { Colors } from "@/constants/theme"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getCompanyProfile, getCompanyStats, getCompanyJobs, CompanyJob, CompanyStats } from "@/lib/mock-data"

const { width: SCREEN_WIDTH } = Dimensions.get("window")
const DRAWER_WIDTH = SCREEN_WIDTH * 0.6

export default function CompanyDashboard() {
  const router = useRouter()
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? "light"]
  const [activeTab, setActiveTab] = useState("jobs")
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const drawerSlide = useRef(new Animated.Value(DRAWER_WIDTH)).current
  
  const [companyName, setCompanyName] = useState("")
  const [stats, setStats] = useState<CompanyStats | null>(null)
  const [recentJobs, setRecentJobs] = useState<CompanyJob[]>([])

useEffect(() => {
    loadCompanyData()
  }, [])

  useEffect(() => {
    if (drawerVisible) {
      setModalVisible(true)
      Animated.timing(drawerSlide, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start()
    } else {
      Animated.timing(drawerSlide, {
        toValue: DRAWER_WIDTH,
        duration: 300,
        useNativeDriver: false,
      }).start(() => {
        setModalVisible(false)
      })
    }
  }, [drawerVisible, drawerSlide])

  const loadCompanyData = () => {
    const company = getCompanyProfile()
    const companyStats = getCompanyStats()
    const jobs = getCompanyJobs()
    
    setCompanyName(company.name)
    setStats(companyStats)
    setRecentJobs(jobs)
  }

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case "active":
        return colors.primary
      case "closed":
        return "#ef4444"
      case "archived":
        return "#6b7280"
      default:
        return "#8b5cf6"
    }
  }

  const handleDeleteJob = (jobId: number) => {
    setRecentJobs(recentJobs.filter(job => job.id !== jobId))
    setOpenMenuId(null)
  }

  const handleEditJob = (jobId: number) => {
    router.push(`posts/edit-job?id=${jobId}` as any)
    setOpenMenuId(null)
  }

  const handleMenuNavigation = (path: string) => {
    setDrawerVisible(false)
    router.push(path as any)
  }

  const handleLogout = () => {
    setDrawerVisible(false)
    router.push("/(auth)/login" as any)
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.pageTitle, { color: colors.foreground }]}>{companyName}</Text>
              <Text style={[styles.pageSubtitle, { color: colors.mutedForeground }]}>Company Dashboard</Text>
            </View>
            <TouchableOpacity 
              style={[styles.settingsButton, { borderColor: colors.border }]}
              onPress={() => setDrawerVisible(true)}
            >
              <Ionicons name="menu" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Stats Overview */}
          {stats && (
            <View style={styles.statsContainer}>
              <StatCard icon="briefcase-outline" label="Active Jobs" value={stats.activeJobs} color={colors.primary} />
              <StatCard icon="people-outline" label="Applicants" value={stats.totalApplicants} color="#3b82f6" />
              <StatCard icon="eye-outline" label="Views" value={stats.viewsThisWeek} color="#a855f7" />
            </View>
          )}

          {/* Post Job Button */}
          <Button
            size="lg"
            onPress={() => router.push("posts/post-job" as any)}
            style={styles.postJobButton}
          >
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.postJobButtonText}>Post New Job</Text>
          </Button>
        </View>

        {/* Jobs Section */}
        <View style={styles.jobsSection}>
          <View style={styles.jobsHeader}>
            <Text style={[styles.jobsTitle, { color: colors.foreground }]}>
              Jobs ({recentJobs.length})
            </Text>
          </View>

          {/* Content */}
          <View style={styles.listContainer}>
            {recentJobs.map((job) => (
              <Card key={job.id} style={styles.jobCard}>
                <CardContent style={styles.cardContent}>
                  <View style={styles.jobCardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <Text style={[styles.jobTitle, { color: colors.cardForeground }]}>
                        {job.title}
                      </Text>
                      <View style={styles.jobMetaRow}>
                        <Ionicons name="people" size={14} color={colors.mutedForeground} />
                        <Text style={[styles.jobMeta, { color: colors.mutedForeground }]}>
                          {job.applicants} applicants • Posted {job.posted}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.headerRight}>
                      <Badge
                        style={{
                          backgroundColor: getStatusColor(job.status) + "20",
                        }}
                        textStyle={{ color: getStatusColor(job.status) }}
                      >
                        <Text>{job.status.charAt(0).toUpperCase() + job.status.slice(1)}</Text>
                      </Badge>
                      <TouchableOpacity
                        style={styles.menuButton}
                        onPress={() => setOpenMenuId(openMenuId === job.id ? null : job.id)}
                      >
                        <Ionicons name="ellipsis-vertical" size={20} color={colors.mutedForeground} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Dropdown Menu */}
                  {openMenuId === job.id && (
                    <View style={[styles.dropdownMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => handleEditJob(job.id)}
                      >
                        <Ionicons name="pencil" size={16} color={colors.primary} />
                        <Text style={[styles.dropdownMenuItemText, { color: colors.primary }]}>Edit Job</Text>
                      </TouchableOpacity>
                      <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
                      <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => handleDeleteJob(job.id)}
                      >
                        <Ionicons name="trash" size={16} color="#ef4444" />
                        <Text style={[styles.dropdownMenuItemText, { color: "#ef4444" }]}>Delete Job</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  {/* Action Buttons */}
                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                      style={[styles.actionButton, { borderColor: colors.primary, borderWidth: 1 }]}
                    >
                      <Text style={[styles.actionButtonText, { color: colors.primary }]}>View Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.primary }]}
                      onPress={() => router.push({
                        pathname: "applicants/review-applicants" as any,
                        params: { jobTitle: job.title }
                      })}
                    >
                      <Text style={styles.actionButtonTextPrimary}>View Applicants</Text>
                    </TouchableOpacity>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Side Drawer Menu */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={() => setDrawerVisible(false)}
      >
        <View style={styles.drawerOverlay}>
          {/* Overlay backdrop with synchronized opacity */}
          <Animated.View
            style={[
              styles.drawerBackdrop,
              {
                opacity: drawerSlide.interpolate({
                  inputRange: [0, DRAWER_WIDTH],
                  outputRange: [0.5, 0],
                }),
              },
            ]}
          >
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => setDrawerVisible(false)}
              activeOpacity={1}
            />
          </Animated.View>

          {/* Drawer Menu */}
          <Animated.View
            style={[
              styles.drawer,
              {
                backgroundColor: colors.background,
                width: DRAWER_WIDTH,
                transform: [{ translateX: drawerSlide }],
              },
            ]}
          >
            {/* Profile Section */}
            <View style={[styles.drawerProfile, { borderBottomColor: colors.border }]}>
              <Avatar style={styles.profileAvatar}>
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                  <Text style={styles.avatarText}>
                    {companyName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              </Avatar>
              <Text style={[styles.companyNameDrawer, { color: colors.foreground }]}>
                {companyName}
              </Text>
            </View>

            {/* Menu Items */}
            <View style={styles.drawerContent}>
              <TouchableOpacity
                onPress={() => handleMenuNavigation("profile/index")}
                style={styles.menuItemDrawer}
              >
                <Ionicons name="person-outline" size={20} color={colors.foreground} />
                <Text style={[styles.drawerMenuItemText, { color: colors.foreground }]}>
                  Profile
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleMenuNavigation("premium/upgrade")}
                style={styles.menuItemDrawer}
              >
                <Ionicons name="star-outline" size={20} color={colors.primary} />
                <Text style={[styles.drawerMenuItemText, { color: colors.primary, fontWeight: "600" }]}>
                  Upgrade to Premium
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleMenuNavigation("profile/settings")}
                style={styles.menuItemDrawer}
              >
                <Ionicons name="settings-outline" size={20} color={colors.foreground} />
                <Text style={[styles.drawerMenuItemText, { color: colors.foreground }]}>
                  Settings
                </Text>
              </TouchableOpacity>
            </View>

            {/* Logout Button */}
            <View style={[styles.drawerFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                onPress={handleLogout}
                style={styles.logoutButton}
              >
                <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                <Text style={[styles.logoutText, { color: "#ef4444" }]}>
                  Logout
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const StatCard = ({ icon, label, value, color }: { icon: any; label: string; value: number; color: string }) => (
  <View style={{ flex: 1 }}>
    <View style={[styles.statCard, { backgroundColor: color + "20" }]}>
      <Ionicons name={icon} size={20} color={color} style={{ marginBottom: 4 }} />
      <Text style={[styles.statValue, { color: color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: Colors.light.mutedForeground }]}>
        {label}
      </Text>
    </View>
  </View>
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 8,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  pageSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  statCard: {
    padding: 12,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  postJobButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    marginBottom: 24,
  },
  postJobButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  jobsSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  jobsHeader: {
    marginBottom: 12,
  },
  jobsTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  listContainer: {
    gap: 12,
  },
  jobCard: {
    marginBottom: 0,
  },
  cardContent: {
    padding: 16,
  },
  jobCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 8,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  menuButton: {
    padding: 4,
  },
  dropdownMenu: {
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  dropdownMenuItemText: {
    fontSize: 14,
    fontWeight: "500",
  },
  menuDivider: {
    height: 1,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  jobMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  jobMeta: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 0,
  },
  appliedTime: {
    fontSize: 11,
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  actionButtonTextPrimary: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  viewButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  reviewButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  reviewButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  drawerOverlay: {
    flex: 1,
  },
  drawerBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  drawer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    paddingTop: 0,
  },
  drawerProfile: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  profileAvatar: {
    width: 90,
    height: 90,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
  },
  companyNameDrawer: {
    fontSize: 16,
    fontWeight: "700",
  },
  drawerContent: {
    flex: 1,
    paddingTop: 12,
  },
  menuItemDrawer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  drawerMenuItemText: {
    fontSize: 15,
    fontWeight: "500",
  },
  drawerFooter: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "600",
  },
})

