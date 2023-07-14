from rest_framework.test import APIClient, APIRequestFactory
from django.test import TestCase

import sheet.factories as factories
import sheet.models as models


class SheetFirearmMagazineTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.request_factory = APIRequestFactory()
        self.owner = factories.UserFactory(username="luke")
        self.sheet = factories.SheetFactory()
        firearm = factories.BaseFirearmFactory(name="AK-47")
        ammo = factories.AmmunitionFactory(calibre__name="7.62x39")
        self.sheet_firearm = models.SheetFirearm.objects.create(sheet=self.sheet, base=firearm, ammo=ammo, scope=None)
        self.assertTrue(
            self.client.login(username="luke", password="foobar"))
        self.url = '/rest/sheets/{}/sheetfirearms/{}/magazines/'.format(self.sheet.pk, self.sheet_firearm.pk)

    def test_url(self):
        response = self.client.get(self.url, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])

    def test_firearm_list(self):
        self.sheet_firearm.magazines.create(current=15, capacity=20)

        url = f'/rest/sheets/{self.sheet.pk}/sheetfirearms/'
        response = self.client.get(url, format='json')
        assert response.status_code == 200
        assert len(response.data) == 1
        firearm = response.data[0]

        assert 'magazines' in firearm
        assert len(firearm['magazines']) == 1
        assert firearm["magazines"][0]["current"] == 15

    def test_sheet_integrity(self):
        sheet2 = factories.SheetFactory()
        invalid_url = "/rest/sheets/{}/sheetfirearms/{}/magazines/".format(
            sheet2.pk, self.sheet_firearm.pk
        )
        response = self.client.get(invalid_url, format='json')
        assert response.status_code == 404

    def test_adding_items(self):
        response = self.client.post(
                self.url,
                data={'capacity': 17,
                      'current': 14 }, format='json')
        assert response.status_code == 201
        assert 'id' in response.data
        assert response.data['capacity'] == 17
        mags = list(self.sheet_firearm.magazines.all())
        assert len(mags) == 1
        assert mags[0].capacity == 17
        assert mags[0].current == 14

    def test_deleting_items(self):
        mag = self.sheet_firearm.magazines.create(current=15, capacity=20)
        response = self.client.delete(f"{self.url}{mag.id}/", data={}, format="json")
        assert response.status_code == 204
        mags = list(self.sheet_firearm.magazines.all())
        assert not mags

    def test_changing_items(self):
        mag = self.sheet_firearm.magazines.create(current=15, capacity=20)
        response = self.client.patch(
            f"{self.url}{mag.id}/",
            data={"capacity": 17, "current": 0},
            format="json",
        )
        assert response.status_code == 200
        assert response.data['current'] == 0
        assert 'id' in response.data

        mags = list(self.sheet_firearm.magazines.all())
        assert mags[0].capacity == 17
        assert mags[0].current == 0

    def test_validation(self):
        mag = self.sheet_firearm.magazines.create(current=15, capacity=20)
        response = self.client.patch(
            f"{self.url}{mag.id}/",
            data={"capacity": 17, "current": -1},
            format="json",
        )
        assert response.status_code == 400

        response = self.client.patch(
            f"{self.url}{mag.id}/",
            data={"capacity": -1, "current": 15},
            format="json",
        )
        assert response.status_code == 400

        response = self.client.patch(
            f"{self.url}{mag.id}/",
            data={"capacity": 20, "current": 21},
            format="json",
        )
        assert response.status_code == 400

        response = self.client.patch(
            f"{self.url}{mag.id}/",
            data={"current": 21},
            format="json",
        )
        assert response.status_code == 400

        response = self.client.patch(
            f"{self.url}{mag.id}/",
            data={"capacity": 12},
            format="json",
        )
        assert response.status_code == 400
