export default function NotificationBanner({ message, visible }) {
  if (!visible) return null;
  return <View style={{ padding: 20, backgroundColor: 'blue' }}><Text>{message}</Text></View>;
}