"""
backend/seed.py - Seed database with realistic Sunrise Interiors data (Bengaluru, India)
"""

from datetime import date, timedelta
from backend.app.database import SessionLocal, engine, Base
from backend.app.models import TeamMember, Project, Lead, Vendor, Invoice, Task, AutomationRule, Notification


def seed_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    today = date.today()

    print("[SEED] Seeding Sunrise Interiors database...")

    # 1. Team Members (3 primary interior design studio members)
    designer_1 = TeamMember(
        name="Ananya Sharma",
        role="Principal Interior Designer & Founder",
        email="ananya@sunriseinteriors.in",
        phone="+919886012345",
        avatar_color="#6366F1",  # Indigo
        is_active=True,
    )
    designer_2 = TeamMember(
        name="Vikram Malhotra",
        role="3D Visualizer & CAD Lead",
        email="vikram@sunriseinteriors.in",
        phone="+919886054321",
        avatar_color="#0EA5E9",  # Sky Blue
        is_active=True,
    )
    designer_3 = TeamMember(
        name="Priya Nair",
        role="Site Architect & Procurement Specialist",
        email="priya@sunriseinteriors.in",
        phone="+919886098765",
        avatar_color="#10B981",  # Emerald
        is_active=True,
    )

    db.add_all([designer_1, designer_2, designer_3])
    db.commit()
    db.refresh(designer_1)
    db.refresh(designer_2)
    db.refresh(designer_3)

    # 2. Automation Rules
    rules = [
        AutomationRule(
            name="Project At Risk Alert",
            description="Automatically generate an urgent dashboard notification when any client project health is marked as 'At Risk'. Prevents duplicate notifications for the same project.",
            trigger_event="PROJECT_HEALTH_AT_RISK",
            action_type="CREATE_DASHBOARD_NOTIFICATION",
            is_active=True,
            execution_count=1,
            last_triggered_at=None,
        ),
        AutomationRule(
            name="Overdue Task Monitor",
            description="Scan all pending design and site tasks. When due date passes without completion, trigger an alert to the studio owner and assigned designer.",
            trigger_event="TASK_OVERDUE",
            action_type="CREATE_DASHBOARD_NOTIFICATION",
            is_active=True,
            execution_count=1,
            last_triggered_at=None,
        ),
        AutomationRule(
            name="High-Budget Lead Router (n8n Simulation)",
            description="Route incoming leads with estimated budget > ₹5,00,000 to senior design partners with high-priority assignment and instant client confirmation.",
            trigger_event="HIGH_BUDGET_LEAD",
            action_type="NOTIFY_SENIOR_TEAM",
            is_active=True,
            execution_count=0,
            last_triggered_at=None,
        ),
    ]
    db.add_all(rules)
    db.commit()

    # 3. Client Projects
    projects = [
        Project(
            project_code="PRJ-001",
            project_name="The Indiranagar Sky Villa",
            client_name="Rajesh & Sunita Mehra",
            client_email="rajesh.mehra@gmail.com",
            client_phone="+919845011223",
            project_type="Residential",
            project_location="100 Feet Rd, Indiranagar, Bengaluru",
            project_budget=3800000.0,
            start_date=(today - timedelta(days=75)).isoformat(),
            expected_handover_date=(today + timedelta(days=20)).isoformat(),
            assigned_designer_id=designer_1.id,
            status="Execution",
            health="On Track",
            progress=78,
            description="Luxury 4BHK penthouse interior featuring Italian marble flooring, custom fluted paneling, and smart automation.",
        ),
        Project(
            project_code="PRJ-002",
            project_name="Roast & Brew Artisan Cafe",
            client_name="Karan Oberoi",
            client_email="karan@roastandbrew.com",
            client_phone="+919845022334",
            project_type="Commercial",
            project_location="5th Block, Koramangala, Bengaluru",
            project_budget=2200000.0,
            start_date=(today - timedelta(days=50)).isoformat(),
            expected_handover_date=(today - timedelta(days=5)).isoformat(),  # Past handover!
            assigned_designer_id=designer_2.id,
            status="Execution",
            health="Delayed",
            progress=65,
            description="Boutique speciality coffee shop with rustic terracotta tiles, exposed brass piping, and bespoke counter seating.",
        ),
        Project(
            project_code="PRJ-003",
            project_name="Fintech Hub Innovation Floor",
            client_name="Naveen Swamy (InnovateHQ)",
            client_email="n.swamy@innovatehq.co",
            client_phone="+919845033445",
            project_type="Office",
            project_location="EPIP Zone, Whitefield, Bengaluru",
            project_budget=6500000.0,
            start_date=(today - timedelta(days=40)).isoformat(),
            expected_handover_date=(today + timedelta(days=45)).isoformat(),
            assigned_designer_id=designer_3.id,
            status="Procurement",
            health="At Risk",
            progress=42,
            description="Ergonomic open-plan workspace for 80 engineers with acoustic ceiling baffles, phone booths, and collaborative lounges.",
        ),
        Project(
            project_code="PRJ-004",
            project_name="HSR Layout Heritage Bungalow Renovation",
            client_name="Dr. Aruna Chandrasekhar",
            client_email="dr.aruna@apollohealth.org",
            client_phone="+919845044556",
            project_type="Renovation",
            project_location="Sector 2, HSR Layout, Bengaluru",
            project_budget=2900000.0,
            start_date=(today - timedelta(days=25)).isoformat(),
            expected_handover_date=(today + timedelta(days=60)).isoformat(),
            assigned_designer_id=designer_1.id,
            status="Design",
            health="On Track",
            progress=30,
            description="Comprehensive interior transformation of a 25-year-old home blending Athangudi floor tiles with modern Scandinavian minimalist cabinetry.",
        ),
        Project(
            project_code="PRJ-005",
            project_name="Sobha Palm Ravine Contemporary Flat",
            client_name="Aditya & Pooja Kulkarni",
            client_email="aditya.kulkarni@techcorp.com",
            client_phone="+919845055667",
            project_type="Residential",
            project_location="Bellandur Outer Ring Road, Bengaluru",
            project_budget=1850000.0,
            start_date=(today - timedelta(days=90)).isoformat(),
            expected_handover_date=(today - timedelta(days=10)).isoformat(),
            assigned_designer_id=designer_2.id,
            status="Completed",
            health="On Track",
            progress=100,
            description="Turnkey interior for a modern 3BHK flat including modular acrylic kitchen, false ceiling with indirect warm cove lighting, and custom walk-in wardrobe.",
        ),
    ]
    db.add_all(projects)
    db.commit()
    for p in projects:
        db.refresh(p)

    # 4. Leads
    leads = [
        Lead(
            lead_code="LED-001",
            client_name="Ravi Kumar",
            email="ravi.kumar@cloudscale.io",
            phone="+919876543210",
            project_type="Residential",
            project_location="Prestige Golfshire, Devanahalli, Bengaluru",
            project_budget=5500000.0,
            project_requirements="Turnkey interior design for a 5BHK luxury villa. Seeking contemporary tropical aesthetic with private plunge pool deck.",
            lead_status="New",
            submission_date=(today - timedelta(days=1)).isoformat(),
        ),
        Lead(
            lead_code="LED-002",
            client_name="Priya Shah",
            email="priya.shah@gmail.com",
            phone="+919876512345",
            project_type="Office",
            project_location="Lavelle Road, Central Bengaluru",
            project_budget=1800000.0,
            project_requirements="Design and fit-out for law firm partner chambers and client conference suite.",
            lead_status="Contacted",
            submission_date=(today - timedelta(days=3)).isoformat(),
        ),
        Lead(
            lead_code="LED-003",
            client_name="Amit Verma",
            email="amit.verma@finbridge.com",
            phone="+919876599887",
            project_type="Commercial",
            project_location="Church Street, Bengaluru",
            project_budget=3200000.0,
            project_requirements="Art gallery and retail experience center with specialized track lighting and climate-controlled display alcoves.",
            lead_status="Qualified",
            submission_date=(today - timedelta(days=6)).isoformat(),
        ),
        Lead(
            lead_code="LED-004",
            client_name="Sneha Reddy",
            email="sneha.reddy@biocare.in",
            phone="+919876500000",
            project_type="Renovation",
            project_location="Sadashivnagar, Bengaluru",
            project_budget=420000.0,
            project_requirements="Kitchen remodel and master bathroom upgrade with premium vitrified tiles and concealed plumbing.",
            lead_status="New",
            submission_date=(today - timedelta(days=2)).isoformat(),
        ),
        Lead(
            lead_code="LED-005",
            client_name="Karan Mehta",
            email="karan.mehta@venturecapital.in",
            phone="+919876511111",
            project_type="Residential",
            project_location="Defiance Col, Defence Colony, Indiranagar",
            project_budget=2800000.0,
            project_requirements="Duplex penthouse interior with customized home theatre and bar lounge.",
            lead_status="Converted",
            submission_date=(today - timedelta(days=80)).isoformat(),
            converted_project_id=projects[0].id,
        ),
    ]
    db.add_all(leads)
    db.commit()

    # 5. Vendors
    vendors = [
        Vendor(
            vendor_code="VND-001",
            vendor_name="Bengaluru Timber & Ply Works",
            contact_person="Manjunath Gowda",
            contact_email="orders@bengalurutimber.com",
            contact_phone="+919844011223",
            category="Carpentry & Millwork",
            address="Timber Yard Layout, Mysore Road, Bengaluru",
        ),
        Vendor(
            vendor_code="VND-002",
            vendor_name="Deccan Architectural Lighting",
            contact_person="Farhan Siddiqui",
            contact_email="sales@deccanlighting.in",
            contact_phone="+919844022334",
            category="Electrical & Lighting",
            address="BVK Iyengar Road, Chickpet, Bengaluru",
        ),
        Vendor(
            vendor_code="VND-003",
            vendor_name="Karnataka Granites & Italian Marble",
            contact_person="Ramesh Patel",
            contact_email="ramesh@karnatakagranite.com",
            contact_phone="+919844033445",
            category="Flooring & Stone",
            address="Bannerghatta Road, Gottigere, Bengaluru",
        ),
        Vendor(
            vendor_code="VND-004",
            vendor_name="Touchstone Furnishings & Drapes",
            contact_person="Geetha Nambiar",
            contact_email="geetha@touchstonehome.in",
            contact_phone="+919844044556",
            category="Fabrics & Upholstery",
            address="Commercial Street, Tasker Town, Bengaluru",
        ),
    ]
    db.add_all(vendors)
    db.commit()
    for v in vendors:
        db.refresh(v)

    # 6. Invoices with varying payment statuses & duplicate protection test
    invoices = [
        Invoice(
            invoice_code="INV-001",
            vendor_id=vendors[0].id,
            related_project_id=projects[0].id,
            material_or_service="Marine Grade Plywood & Teak Veneer Sheets",
            invoice_number="BTP-2026-089",
            invoice_date=(today - timedelta(days=40)).isoformat(),
            payment_due_date=(today - timedelta(days=10)).isoformat(),
            invoice_amount=450000.0,
            amount_paid=450000.0,
            outstanding_amount=0.0,
            payment_status="Paid",
            payment_reference="HDFC-NEFT-99120491",
            notes="Full payment cleared after moisture check passed on site.",
        ),
        Invoice(
            invoice_code="INV-002",
            vendor_id=vendors[1].id,
            related_project_id=projects[0].id,
            material_or_service="Magnetic Track Lights & COB Downlighters",
            invoice_number="DAL-7741",
            invoice_date=(today - timedelta(days=20)).isoformat(),
            payment_due_date=(today + timedelta(days=10)).isoformat(),
            invoice_amount=185000.0,
            amount_paid=90000.0,
            outstanding_amount=95000.0,
            payment_status="Partially Paid",
            payment_reference="UPI-REF-3341908",
            notes="50% advance released on dispatch. Balance due on installation.",
        ),
        Invoice(
            invoice_code="INV-003",
            vendor_id=vendors[2].id,
            related_project_id=projects[1].id,
            material_or_service="Terracotta Handmade Tiles & Grout Material",
            invoice_number="KGM-5510",
            invoice_date=(today - timedelta(days=35)).isoformat(),
            payment_due_date=(today - timedelta(days=5)).isoformat(),  # Overdue!
            invoice_amount=160000.0,
            amount_paid=0.0,
            outstanding_amount=160000.0,
            payment_status="Overdue",
            payment_reference=None,
            notes="Payment overdue by 5 days. Hold released pending site delivery sign-off.",
        ),
        Invoice(
            invoice_code="INV-004",
            vendor_id=vendors[0].id,
            related_project_id=projects[2].id,
            material_or_service="Fire-Retardant MDF Board Paneling",
            invoice_number="BTP-2026-112",
            invoice_date=(today - timedelta(days=10)).isoformat(),
            payment_due_date=(today + timedelta(days=15)).isoformat(),
            invoice_amount=320000.0,
            amount_paid=0.0,
            outstanding_amount=320000.0,
            payment_status="Pending",
            payment_reference=None,
            notes="Awaiting approval from project lead Vikram before release.",
        ),
    ]
    db.add_all(invoices)
    db.commit()

    # 7. Tasks
    tasks = [
        Task(
            task_code="TSK-001",
            task_name="Finalize Kitchen Joinery Shop Drawings",
            description="Detail the internal drawer organization, Blum hinge specifications, and quartz waterfall edge detail.",
            related_project_id=projects[0].id,
            assigned_team_member_id=designer_2.id,
            priority="High",
            status="Completed",
            start_date=(today - timedelta(days=20)).isoformat(),
            due_date=(today - timedelta(days=5)).isoformat(),
            completion_date=(today - timedelta(days=6)).isoformat(),
        ),
        Task(
            task_code="TSK-002",
            task_name="Site Inspection: HVAC Ducting & Ceiling Level Verification",
            description="Inspect AC duct drops and coordinate with false ceiling grid installer to avoid level mismatches.",
            related_project_id=projects[2].id,
            assigned_team_member_id=designer_3.id,
            priority="Urgent",
            status="In Progress",
            start_date=(today - timedelta(days=8)).isoformat(),
            due_date=(today - timedelta(days=2)).isoformat(),  # Overdue task!
            completion_date=None,
        ),
        Task(
            task_code="TSK-003",
            task_name="Italian Marble Slab Selection at Gottigere Yard",
            description="Accompany Mr. Rajesh Mehra to tag 4 matched Statuario marble slabs for master suite feature wall.",
            related_project_id=projects[0].id,
            assigned_team_member_id=designer_1.id,
            priority="Medium",
            status="Review",
            start_date=(today - timedelta(days=4)).isoformat(),
            due_date=(today + timedelta(days=3)).isoformat(),
            completion_date=None,
        ),
        Task(
            task_code="TSK-004",
            task_name="Review Material Submittals & Veneer Stain Samples",
            description="Review 3 coats of PU natural walnut stain samples submitted by Bengaluru Timber works.",
            related_project_id=projects[3].id,
            assigned_team_member_id=designer_1.id,
            priority="Low",
            status="To Do",
            start_date=(today - timedelta(days=2)).isoformat(),
            due_date=(today + timedelta(days=5)).isoformat(),
            completion_date=None,
        ),
    ]
    db.add_all(tasks)
    db.commit()

    # 8. Trigger Initial Notifications from Seed
    from datetime import datetime
    now = datetime.utcnow()
    notifications = [
        Notification(
            title="Project At Risk: Fintech Hub Innovation Floor",
            message="Project 'Fintech Hub Innovation Floor' (PRJ-003) is marked At Risk. Budget: ₹6,500,000.00. Acoustic panel supplier is delayed by 10 days.",
            notification_type="project_at_risk",
            related_project_id=projects[2].id,
            is_read=False,
            created_at=now - timedelta(hours=3),
        ),
        Notification(
            title="Task Overdue: Site Inspection: HVAC Ducting & Ceiling Level Verification",
            message="Task 'Site Inspection: HVAC Ducting & Ceiling Level Verification' for project 'Fintech Hub Innovation Floor' was due 2 days ago and is currently overdue. Status: In Progress.",
            notification_type="task_overdue",
            related_project_id=projects[2].id,
            related_task_id=tasks[1].id,
            is_read=False,
            created_at=now - timedelta(hours=1),
        ),
    ]
    db.add_all(notifications)
    db.commit()

    print("[SEED] Database seeded successfully with realistic Sunrise Interiors data!")
    db.close()


if __name__ == "__main__":
    seed_database()
