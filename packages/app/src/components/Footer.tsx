export default function Footer(): React.ReactElement {
  return (
    <footer className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
        <span>&copy; {new Date().getFullYear()} Synflow. All rights reserved.</span>
        <span>v0.1.0</span>
      </div>
    </footer>
  )
}
