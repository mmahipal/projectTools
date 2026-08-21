// Add these state declarations at the top of the UserManagement component after other useState declarations:
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
const [deleteConfirmData, setDeleteConfirmData] = useState(null);