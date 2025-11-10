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
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    borderRadius: 45,
    paddingHorizontal: 20,
    paddingTop: 15.5,
    
  },

  avatar: {
    height: 75, 
    width: 75, 
    borderRadius: 37.5, 
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  editButton:{
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.white,
    padding: 6,
    position: "absolute",
    right: -2,
    bottom: -2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },

  welcomeContainer: {
    flex: 1,
    paddingLeft:20
  },
  welcomeText: {
    fontSize: 22,
    color: COLORS.white,
    marginBottom: 4,
    fontWeight: "700",
  },
  usernameText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.white,
    opacity: 0.85,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 10,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textLight,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
    marginLeft: 40,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  required: {
    color: '#e74c3c',
    fontSize: 16,
  },
   text: {
    marginLeft: 40,
    padding: 8, 
    paddingRight: 4,
    fontWeight: "600",
    placeholderTextColor: "#999"
    
  },

  textInput: {
    backgroundColor: COLORS.white,
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 16,
    color: COLORS.text,
    marginHorizontal: 40,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bioInput: {
    minHeight: 80,
    paddingTop: 14,
  },
  ageDisplay: {
    backgroundColor: COLORS.white,
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: 40,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },

  selected: {
    backgroundColor: COLORS.white,
    fontSize: 16,
    marginBottom: 5,
    marginHorizontal: 40,
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateInput: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 40,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  dateModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  dateModalCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  dateModalActions: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
    alignItems: "center",
  },
  dateModalButton: {
    backgroundColor: COLORS.redwine,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  dateModalButtonText: {
    color: COLORS.white,
    fontWeight: "600",
    alignItems: 'center'
  },
  dateModalButtonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.redwine,
    marginRight: 12,
  },
  dateModalButtonSecondaryText: {
    color: COLORS.redwine,
    fontWeight: "600",
    alignItems: 'center'
  },

  genderSelected: {
    width: '100%',
  },
  AgeSelected: {
    width: '100%',
  },
  
  fillBack: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  fillButtom: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },

  confirmButtom: {
    backgroundColor: "#800020",
    padding: 12,
    borderRadius: 20,
    marginTop: 8,
    alignItems: "center",
  },

  box: {
   position: 'absolute',
   top: 494 ,
   right: 1
  },
  twoColRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 0,
  },
  col: {
    flex: 1,
    minWidth: 0,
  },

  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 32,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    minWidth: 200,
  },

  textNextButton: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 17,
    marginRight: 8,
  },

  linkText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "600",
    textDecorationLine: "underline",
    textAlign: "center",
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 20,
  },
});
