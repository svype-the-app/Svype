import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Colors } from '@/constants/theme';
import { mockCompanyPosts } from '@/lib/mock-company';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CompanyPostsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', type: 'update' });

  const posts = mockCompanyPosts;

  const handleCreatePost = () => {
    Alert.alert('Post Published!', 'Your post is now visible to candidates and followers.');
    setShowCreatePost(false);
    setNewPost({ title: '', content: '', type: 'update' });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Posts & Blogs</Text>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowCreatePost(!showCreatePost)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.createButtonText}>New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Create Post Form */}
        {showCreatePost && (
          <Card style={[styles.createPostCard, { borderColor: colors.primary, borderWidth: 2 }]}>
            <CardContent style={styles.createPostContent}>
              <Text style={[styles.createPostTitle, { color: colors.foreground }]}>Create New Post</Text>

              {/* Post Type Tabs */}
              <View style={styles.typeSelector}>
                <Text style={[styles.label, { color: colors.foreground }]}>Post Type</Text>
                <View style={styles.typeTabs}>
                  <TouchableOpacity
                    style={[
                      styles.typeTab,
                      { borderColor: colors.border },
                      newPost.type === 'update' && { backgroundColor: colors.primary },
                    ]}
                    onPress={() => setNewPost({ ...newPost, type: 'update' })}
                  >
                    <Text
                      style={[
                        styles.typeTabText,
                        { color: newPost.type === 'update' ? '#fff' : colors.foreground },
                      ]}
                    >
                      Company Update
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeTab,
                      { borderColor: colors.border },
                      newPost.type === 'blog' && { backgroundColor: colors.primary },
                    ]}
                    onPress={() => setNewPost({ ...newPost, type: 'blog' })}
                  >
                    <Text
                      style={[
                        styles.typeTabText,
                        { color: newPost.type === 'blog' ? '#fff' : colors.foreground },
                      ]}
                    >
                      Blog Article
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Title Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.foreground }]}>Title</Text>
                <Input
                  value={newPost.title}
                  onChangeText={(text) => setNewPost({ ...newPost, title: text })}
                  placeholder="Enter a catchy title..."
                  style={[styles.input, { color: colors.foreground }]}
                />
              </View>

              {/* Content Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.foreground }]}>Content</Text>
                <TextInput
                  value={newPost.content}
                  onChangeText={(text) => setNewPost({ ...newPost, content: text })}
                  placeholder="Share your thoughts, updates, or insights..."
                  multiline
                  numberOfLines={8}
                  textAlignVertical="top"
                  style={[
                    styles.textarea,
                    {
                      color: colors.foreground,
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <Button variant="outline" style={styles.actionButton} onPress={() => setShowCreatePost(false)}>
                  <Text style={[styles.cancelButtonText, { color: colors.foreground }]}>Cancel</Text>
                </Button>
                <Button style={styles.actionButton} onPress={handleCreatePost}>
                  <Text style={styles.publishButtonText}>Publish Post</Text>
                </Button>
              </View>
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        <View style={styles.statsGrid}>
          <Card style={[styles.statCard, { borderColor: colors.border, borderWidth: 2 }]}>
            <CardContent style={styles.statCardContent}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>12</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total Posts</Text>
            </CardContent>
          </Card>
          <Card style={[styles.statCard, { borderColor: colors.border, borderWidth: 2 }]}>
            <CardContent style={styles.statCardContent}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>8.4k</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total Views</Text>
            </CardContent>
          </Card>
          <Card style={[styles.statCard, { borderColor: colors.border, borderWidth: 2 }]}>
            <CardContent style={styles.statCardContent}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>1.2k</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Engagements</Text>
            </CardContent>
          </Card>
        </View>

        {/* Posts List */}
        <View style={styles.postsSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your Posts</Text>
          {posts.map((post) => (
            <Card key={post.id} style={[styles.postCard, { borderColor: colors.border, borderWidth: 2 }]}>
              <CardContent style={styles.postCardContent}>
                <View style={styles.postHeader}>
                  <Badge variant={post.type === 'blog' ? 'default' : 'secondary'}>
                    <Text style={[styles.badgeText, { color: post.type === 'blog' ? '#fff' : colors.foreground }]}>
                      {post.type === 'blog' ? 'Blog' : 'Update'}
                    </Text>
                  </Badge>
                  <TouchableOpacity style={styles.moreButton}>
                    <Ionicons name="ellipsis-vertical" size={20} color={colors.foreground} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.postTitle, { color: colors.foreground }]}>{post.title}</Text>
                <Text style={[styles.postContent, { color: colors.mutedForeground }]} numberOfLines={2}>
                  {post.content}
                </Text>

                <View style={[styles.postFooter, { borderTopColor: colors.border }]}>
                  <View style={styles.postStats}>
                    <View style={styles.postStat}>
                      <Ionicons name="eye-outline" size={16} color={colors.mutedForeground} />
                      <Text style={[styles.postStatText, { color: colors.mutedForeground }]}>{post.views}</Text>
                    </View>
                    <View style={styles.postStat}>
                      <Ionicons name="heart-outline" size={16} color={colors.mutedForeground} />
                      <Text style={[styles.postStatText, { color: colors.mutedForeground }]}>{post.likes}</Text>
                    </View>
                    <View style={styles.postStat}>
                      <Ionicons name="chatbubble-outline" size={16} color={colors.mutedForeground} />
                      <Text style={[styles.postStatText, { color: colors.mutedForeground }]}>{post.comments}</Text>
                    </View>
                  </View>
                  <Text style={[styles.postDate, { color: colors.mutedForeground }]}>{post.publishedAt}</Text>
                </View>
              </CardContent>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  createPostCard: {
    marginBottom: 8,
  },
  createPostContent: {
    padding: 16,
    gap: 16,
  },
  createPostTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  typeSelector: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  typeTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputGroup: {
    gap: 8,
  },
  input: {
    fontSize: 14,
  },
  textarea: {
    height: 120,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  publishButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
  },
  statCardContent: {
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  postsSection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  postCard: {
    marginTop: 8,
  },
  postCardContent: {
    padding: 16,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  moreButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  postStats: {
    flexDirection: 'row',
    gap: 16,
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postStatText: {
    fontSize: 12,
  },
  postDate: {
    fontSize: 12,
  },
});
