import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.LinkedList;

public class MWMCSVtoXML {
public static void main(String[] args) throws IOException {
	// Open TSV file
	File fileName = new File("C:/Users/Eric/Downloads/MWMCSV.csv");
	BufferedReader tsv;
	try {
		tsv = new BufferedReader(
				new InputStreamReader(new FileInputStream(fileName),StandardCharsets.UTF_8));
	} catch (FileNotFoundException e) {
		e.printStackTrace();
		return;
	}
	
	// Create and open new XML file
	fileName = new File("C:/Users/Eric/Downloads/MordStats.xml");
	fileName.createNewFile();
	BufferedWriter xml = null;
	xml = new BufferedWriter(new FileWriter(fileName));
	String line = tsv.readLine();

	
	// Begin converting //
	
	// When splitting into tokens, the weapon cost/name line starts with tokens[0],
	// but all other lines start with tokens[1] as tokens[0] will be blank
	String delim = "[,]+";
	String[] tokens, name_type;
	String[] titles, data;
	String attType, name, type;
	LinkedList<String> speedData = new LinkedList<String>();
	xml.write("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\r\n" + 
			"<data-set>\n");

	while (line != null) {
		// Begin loop for adding weapon
		tokens = line.split(delim);
		if (tokens.length < 1) {
			line = tsv.readLine();
			continue;
		}
		name_type = tokens[1].split("[\\[]");
		name = name_type[0].substring(0, name_type[0].length()-1);
		name_type = name_type[1].split("[ ]");
		type = name_type[name_type.length-1].substring(0, name_type[name_type.length-1].length()-1);
		
		xml.write("\t<Weapon>\n\t\t<Name>"+name+"</Name>\n");
		xml.write("\t\t<Type>"+type+"</Type>\n");
		xml.write("\t\t<Points>"+tokens[0]+"</Points>\n");
		if (line.contains("[Peasant")) {
			xml.write("\t\t<PeasantOnly>Yes</PeasantOnly>\n");
		} else {
			xml.write("\t\t<PeasantOnly>No</PeasantOnly>\n");
		}
		
		if (line.contains("[Misc")) {
			xml.write("\t\t<Misc>Yes</Misc>\n");
		} else {
			xml.write("\t\t<Misc>No</Misc>\n");
		}
		
		line = tsv.readLine();
		while (line != null) {
			// Begin loop for Attack Type
			tokens = line.split(delim);	
			if (tokens.length < 3) {
				break;
			}
			attType = tokens[1];
			xml.write("\t\t<Attack>\n\t\t\t<AttackType>"+attType+"</AttackType>\n");

			if (!attType.contains("Shield")) {
				line = tsv.readLine();
				titles = tsv.readLine().split(delim);
				data = tsv.readLine().split(delim);
				xml.write("\t\t\t<Damage>\n");
				
				// Speed Data appears on same line as first line of damage but is written to file later
				for (int i=6; i<data.length; i++) {
					speedData.add(data[i]);
				}

				// Add damage data
				for (int bp=0; bp<3; bp++) {
					xml.write("\t\t\t\t<"+data[1]+">\n");
					for (int ap=1; ap<=4; ap++) {
						xml.write("\t\t\t\t\t<"+titles[ap].replaceAll("\\s","")+">"
								+ data[ap+1]
								+ "</"+titles[ap].replaceAll("\\s","")+">\n");
					}
					xml.write("\t\t\t\t</"+data[1]+">\n");
					data = tsv.readLine().split(delim);
				}
				xml.write("\t\t\t</Damage>\n");

				// Add speed data (if not a thrown melee attack as as speed data for that is not present, for now)
				if (!attType.contains("Melee Throw")) {
					xml.write("\t\t\t<Speed>\n");
					for (int sp=0; sp<speedData.size(); sp++) {
						xml.write("\t\t\t\t<"+titles[sp+5]+">"+speedData.get(sp)
								+ "</"+titles[sp+5]+">\n");
					}
					speedData.clear();
					xml.write("\t\t\t</Speed>\n");
				}
			}
			
			// Add general stats
			xml.write("\t\t\t<GeneralStats>\n");
			titles = tsv.readLine().split(delim);
			data = tsv.readLine().split(delim);
			
			for (int i=1; i<titles.length; i++) {
				if (titles[i].contains("Is block held")) {
					titles[i] = "BlockHeld";
				} else if (titles[i].contains("Block Movement Restriction")) {
					titles[i] = "BMoveRest";
				} else if (titles[i].contains("Parry Drain Negation")) {
					titles[i] = "ParryDrainNeg";
				} else if (titles[i].contains("Projectile Speed")) {
					titles[i] = "ProjSpeed";
				} else {
					titles[i] = titles[i].replaceAll("([-, ])", "");
				}
				xml.write("\t\t\t\t<"+titles[i]+">"+data[i]+"</"+titles[i]+">\n");
			}
			
			// Check for second line of general stat titles starting with "Stop On Hit", add stats if found
			line = tsv.readLine();
			if (line.split(delim).length > 1 && (line.split(delim))[1].contains("Stop On Hit")) {
				titles = line.split(delim);
				data = tsv.readLine().split(delim);
				
				for (int i=1; i<titles.length; i++) {
					if (titles[i].contains("Is block held")) {
						titles[i] = "BlockHeld";
					} else if (titles[i].contains("Block Movement Restriction")) {
						titles[i] = "BMoveRest";
					} else if (titles[i].contains("Parry Drain Negation")) {
						titles[i] = "ParryDrainNeg";
					} else if (titles[i].contains("Projectile Speed")) {
						titles[i] = "ProjSpeed";
					} else {
						titles[i] = titles[i].replaceAll("([-, ])", "");
					}
					xml.write("\t\t\t\t<"+titles[i]+">"+data[i]+"</"+titles[i]+">\n");
				}
			} else {
				
			}
			xml.write("\t\t\t</GeneralStats>\n");
			xml.write("\t\t</Attack>\n");
			
			if (!line.contains("Melee Throw")) line = tsv.readLine();
			System.out.println(line);
		}
		xml.write("\t</Weapon>\n");
	}
	xml.write("</data-set>");
	
	
	// Close files
	xml.close();
	tsv.close();
	System.out.println("Done");
}
}
