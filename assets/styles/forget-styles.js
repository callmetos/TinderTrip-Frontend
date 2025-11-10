// styles/home.styles.js
import { StyleSheet } from "react-native";
import { COLORS } from "../../color/colors.js";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingBottom: 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 0,
    paddingVertical: 12,
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  headerLogo: {
    width: 75,
    height: 75,
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  usernameText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.text,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: COLORS.white,
    fontWeight: "600",
    marginLeft: 4,
  },
  logoutButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  imageContainer: {
    alignItems: "center",       
    marginBottom: 10,
  },
   verificationLogo: {
    width: 319,
    height: 319,
    resizeMode: "contain",
  },
  verificationContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  verificationTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.shadow,
    marginBottom: 20,
    textAlign: "center",
  },
  passwordTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.shadow,
    marginBottom: 20,
    textAlign: "left",
  },
  verificationText: {
    fontSize: 16,
    fontWeight: "400",
    color: COLORS.shadow,
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 22,
  },
  passwordText: {
    fontSize: 16,
    fontWeight: "400",
    color: COLORS.shadow,
    marginBottom: 20,
    textAlign: "left",
    lineHeight: 22,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  resetButton: {
    backgroundColor: COLORS.redwine,
    borderRadius: 30,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
  },
  resetButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  verificationInput: {
    backgroundColor: COLORS.creem,
    borderRadius: 12,
    padding: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 16,
    color: COLORS.text,
    width: "100%",
    textAlign: "left",
    letterSpacing: 2,
    justifyContent: "center",
  },
  resendLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  resendLinkDisabled: {
    color: COLORS.textLight,
    textDecorationLine: 'none',
  },

});