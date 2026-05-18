import { Redirect } from 'expo-router';

export default function PostsIndexRedirect() {
  return <Redirect href="/(company)/posts/post-job" />;
}
