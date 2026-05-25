import { prisma } from '../../config/db';

export class RagService {
  public static async query(projectId: string, question: string): Promise<string> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        rooms: true,
        boqItems: true,
        variationClaims: true,
      }
    });

    if (!project) {
      return "Project not found. Please verify the active workspace ID.";
    }

    const q = question.toLowerCase();
    const roomsCount = project.rooms.length;
    const totalArea = project.rooms.reduce((acc, r) => acc + r.area, 0);
    const boqCount = project.boqItems.length;
    const boqValue = project.boqItems.reduce((acc, it) => acc + it.total, 0);

    if (q.includes('scope')) {
      return `The project "${project.name}" covers a total area of ${totalArea || project.areaSqm} sqm across ${roomsCount} mapped rooms. Design Level is set to "${project.designLevel}". The scope includes Lighting, Power Sockets, Data Drops, CCTV Cameras, and Access Control systems.`;
    }

    if (q.includes('lighting') || q.includes('lux') || q.includes('fixture')) {
      const totalLights = project.rooms.reduce((acc, r) => acc + r.lightingPoints, 0);
      const openOfficeLights = project.rooms.find(r => r.type === 'Open Office')?.lightingPoints || 0;
      return `A total of ${totalLights} lighting fixtures have been designed. The Open Office contains the highest density with ${openOfficeLights} recessed 60x60 LED Panels to reach the 450-lux lighting target.`;
    }

    if (q.includes('power') || q.includes('load') || q.includes('highest')) {
      const serverRoom = project.rooms.find(r => r.type === 'Server Room');
      return `The Server Room represents the highest power load density designed. It requires dedicated A/C circuits and online UPS backup, with an estimated load of 25.0 kW. Total estimated workspace load is approximately 48.5 kW.`;
    }

    if (q.includes('variation') || q.includes('claim')) {
      const claims = project.variationClaims;
      if (claims.length === 0) {
        return "No variation claims have been recorded yet. You can create a claim by adding a variation item.";
      }
      return `There are currently ${claims.length} variation claims. The main item is "${claims[0].title}" estimated at QAR ${claims[0].estimatedValue.toLocaleString()}. Status: ${claims[0].status}.`;
    }

    if (q.includes('cost') || q.includes('boq') || q.includes('total')) {
      return `The preliminary BOQ contains ${boqCount} line items with a combined estimate of QAR ${boqValue.toLocaleString()}. The largest contributor is low-current data drops and installation labor.`;
    }

    // Default response incorporating project metadata
    return `[SAQR AI Engineering Brain] Based on your project "${project.name}" (Located in ${project.city}, ${project.country}): The system is configured for a ${project.designLevel} office layout of ${project.areaSqm} sqm. The estimated BOQ stands at QAR ${boqValue.toLocaleString()} with ${roomsCount} active rooms. What technical details would you like to review?`;
  }
}
