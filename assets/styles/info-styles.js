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
    height: 69, 
    width: 69, 
    borderRadius: 32, 
    borderColor: COLORS.textLight,
  },
  editButton:{
    borderRadius: 24,
    borderColor:COLORS.white,
    padding: 8,
    position: "absolute",
    right: -4,
    bottom: -9,

  },

  welcomeContainer: {
    flex: 1,
    paddingLeft:20
  },
  welcomeText: {
    fontSize: 20,
    color: COLORS.white,
    marginBottom: 2,
    fontWeight: "700",
  },
  usernameText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.white,
    opacity: 0.5,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.shadow,
    marginVertical: 15,
    textAlign: "center",
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
    padding: 10,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 16,
    color: COLORS.text,
    marginHorizontal: 40,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    paddingLeft: 20,
  },

  selected: {
    backgroundColor: COLORS.white,
    fontSize: 16,
    marginBottom: 5,
    marginHorizontal: 40,
    borderRadius: 25,
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    paddingLeft: 20,
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
    width: 170
  },
  AgeSelected: {
    width: 117,
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
  flexWrap: 'nowrap',        // กันไม่ให้ตัดบรรทัด
  },
  col: {
    flex: 1,                   // แบ่งพื้นที่เท่ากัน
    minWidth: 0,
    marginRight: -50,
    
  },

  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
    backgroundColor: "#F8F5F2",   // soft beige like your screenshot
    borderColor: "#5A1D1D",      // dark red border
    borderWidth: 1,
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginTop: 24,
    marginRight: 30,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  textNextButton: {
    color: "#5A1D1D",
    fontWeight: "600",
    fontSize: 16,
    marginRight: 8,
  },

  linkText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
    textAlign: "right",
    alignSelf: "flex-end",
    marginRight: 30,
    marginTop: -10,
    marginBottom: 10,
  },
});
